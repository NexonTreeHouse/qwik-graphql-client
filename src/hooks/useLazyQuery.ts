import { print } from "graphql";
import {
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  gql,
} from "@apollo/client/core";
import { useGraphQLClientContext } from "../components/provider/qwik-graphql-client";
import { $, QRL, Signal, useSignal } from "@builder.io/qwik";
import { QueryHookOptions } from "..";

export const useLazyQuery = <T, V extends OperationVariables>(
  query: DocumentNode | TypedDocumentNode<T, V>,
  options?: QueryHookOptions<T, V>
): {
  executeQuery$: QRL<(variables: V) => void>;
  data: Signal<Promise<T> | undefined>;
} => {
  const ctx = useGraphQLClientContext();

  const queryString = print(query);

  const data = useSignal<Promise<T> | undefined>(undefined);

  const executeQuery$ = $(async (variables: V) => {
    const client = options?.clientGenerator$
      ? await options.clientGenerator$()
      : ctx.client;
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

    let resolved = false;
    data.value = new Promise((resolve, reject) => {
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
  });

  return { executeQuery$, data };
};
