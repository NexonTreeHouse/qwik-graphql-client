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
    const client = options?.clientMaker$
      ? await options.clientMaker$()
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
    data.value = new Promise<T>((resolve, reject) => {
      observable.subscribe({
        error: (error) => {
          if (options?.onError$) options.onError$(error);
          reject(error);
        },
        next: (result) => {
          if (result.error) {
            if (options?.onError$) options.onError$(result.error);
            reject(result.error);
          }

          if (!resolved) {
            resolved = true;
            if (options?.onCompleted$) options.onCompleted$(result.data);
            resolve(result.data);
          }
        },
      });
    });
  });

  return { executeQuery$, data };
};
