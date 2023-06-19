import { print } from "graphql";
import {
  DocumentNode,
  ObservableQuery,
  OperationVariables,
  TypedDocumentNode,
  gql,
} from "@apollo/client/core";
import { useGraphQLClientContext } from "../components/provider/qwik-graphql-client";
import { $, QRL, Signal, useSignal } from "@builder.io/qwik";
import { ClientGenerator, QueryHookOptions } from "..";

export function useLazyQuery<T, V extends OperationVariables>(
  query: DocumentNode | TypedDocumentNode<T, V>,
  options?: QueryHookOptions<T, V> & { clientGenerator$?: ClientGenerator }
): {
  executeQuery$: QRL<(variables: V) => void>;
  data: Signal<Promise<T> | undefined>;
} {
  const queryString = print(query);
  const data = useSignal<Promise<T> | undefined>(undefined);

  if (options?.clientGenerator$) {
    const executeQuery$ = $(async (variables: V) => {
      const client = await options.clientGenerator$?.();
      if (!client) {
        throw new Error("No client");
      }
      const observable = client!.watchQuery<T, V>({
        query: gql`
          ${queryString}
        `,
        variables,
        ...options,
      });

      data.value = setData<T, V>(observable, options);
    });

    return { executeQuery$, data };
  }

  const ctx = useGraphQLClientContext();

  const executeQuery$ = $(async (variables: V) => {
    const client = ctx.client;
    if (!client) {
      throw new Error("No client");
    }

    const observable = client!.watchQuery<T, V>({
      query: gql`
        ${queryString}
      `,
      variables,
      ...options,
    });

    data.value = setData<T, V>(observable, options);
  });
  return { executeQuery$, data };
}

const setData = <T, V extends OperationVariables>(
  observable: ObservableQuery<T, V>,
  options?: QueryHookOptions<T, V>
): Promise<T> => {
  let resolved = false;

  return new Promise((resolve, reject) => {
    observable.subscribe({
      error: (error) => {
        options?.onError$?.(error);
        reject(error);
      },
      next: ({ data, error }) => {
        if (error) {
          options?.onError$?.(error);
          if (options?.errorPolicy === "ignore") {
            options?.onCompleted$?.(data);
            resolve(data);
          }
          reject(error);
        }

        if (!resolved) {
          resolved = true;
          options?.onCompleted$?.(data);
          resolve(data);
        }
      },
    });
  });
};
