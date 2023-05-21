import {
  ApolloClient,
  ApolloError,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  WatchQueryFetchPolicy,
  gql,
} from "@apollo/client/core";
import { QRL, ResourceReturn, useResource$ } from "@builder.io/qwik";
import { print } from "graphql";
import { QueryFunctionOptions as ApolloQueryHookOptions } from "@apollo/client";
import { useApolloClient } from "..";
// import { isServer } from "@builder.io/qwik/build";

export type ClientMaker = QRL<() => ApolloClient<any>>;

export type QueryHookOptions<
  TData,
  TVariables extends OperationVariables
> = Omit<
  ApolloQueryHookOptions<TData, TVariables>,
  | "variables"
  | "nextFetchPolicy"
  | "onCompleted"
  | "onError"
  | "defaultOptions"
  | "client"
  | "ssr"
  | "skip"
  | "returnPartialData"
> & {
  nextFetchPolicy?: WatchQueryFetchPolicy;
  onCompleted$?: QRL<(data: TData) => void>;
  onError$?: QRL<(error: ApolloError) => void>;
  clientGenerator$?: ClientMaker;
};

export function useQuery<T, V extends OperationVariables>(
  query: DocumentNode | TypedDocumentNode<T, V>,
  variables: V,
  options?: QueryHookOptions<T, V>
): ResourceReturn<T> {
  const ctx = useApolloClient();

  const queryString = print(query);

  return useResource$<T>(async ({ track, cleanup }) => {
    track(variables);

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
    return new Promise((resolve, reject) => {
      const sub = observable.subscribe({
        error: (error) => {
          options?.onError$?.(error);

          reject(error);
        },
        next: ({ data, error }) => {
          if (error) {
            options?.onError$?.(error);
            if (options?.errorPolicy === "ignore") {
              options?.onCompleted$ && options.onCompleted$(data);
              resolve(data);
            }
            reject(error);
          }

          if (!resolved) {
            resolved = true;
            options?.onCompleted$ && options.onCompleted$(data);
            resolve(data);
          }
        },
      });

      cleanup(() => sub.unsubscribe());
    });
  });
}
