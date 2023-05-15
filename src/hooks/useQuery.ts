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
> & {
  nextFetchPolicy?: WatchQueryFetchPolicy;
  onCompleted$?: QRL<(data: TData) => void>;
  onError$?: QRL<(error: ApolloError) => void>;
  clientMaker$?: QRL<() => ApolloClient<any>>;
};

export function useQuery<T, V extends OperationVariables>(
  query: DocumentNode | TypedDocumentNode<T, V>,
  variables: V,
  options?: QueryHookOptions<T, V>
): ResourceReturn<T> | undefined {
  const ctx = useApolloClient();

  const queryString = print(query);

  return useResource$<T>(async ({ track, cleanup }) => {
    if (variables) track(variables);

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
    return new Promise((resolve, reject) => {
      const sub = observable.subscribe({
        error: (error) => {
          if (options?.onError$) options.onError$(error);
          reject(error);
        },
        next: ({ data, error }) => {
          if (error) {
            if (options?.onError$) options.onError$(error);
            reject(error);
          }

          if (!resolved) {
            resolved = true;
            if (options?.onCompleted$) options.onCompleted$(data);
            resolve(data);
          }
        },
      });

      cleanup(() => sub.unsubscribe());
    });
  });
}
