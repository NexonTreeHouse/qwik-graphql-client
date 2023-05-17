import {
  ApolloError,
  DefaultContext,
  DocumentNode,
  InternalRefetchQueriesInclude,
  OperationVariables,
  TypedDocumentNode,
  gql,
} from "@apollo/client/core";
import { print } from "graphql";
import { useGraphQLClientContext } from "../components/provider/qwik-graphql-client";
import { BaseMutationOptions } from "@apollo/client";
import { QRL, $, useSignal, Signal } from "@builder.io/qwik";
import { ClientMaker } from "./useQuery";

type MutationHookOptions<
  TData,
  TVariables extends OperationVariables,
  TContext extends DefaultContext = {}
> = Omit<
  BaseMutationOptions<TData, TVariables, TContext>,
  | "variables"
  | "client"
  // done - ^
  | "optimisticResponse"
  | "refetchQueries"
  | "onCompleted"
  | "onError"
  // todo - test if this actually works^
  | "update"
  | "onQueryUpdated"
  // ! not implemented^
> & {
  optimisticResponse$?: TData | QRL<(vars: TVariables) => TData>;
  refetchQueries$?: InternalRefetchQueriesInclude;
  clientMaker$?: ClientMaker;
  onCompleted$?: QRL<(data: TData) => void>;
  onError$?: QRL<
    (error: ApolloError, clientOptions?: BaseMutationOptions) => void
  >;
};

export const useMutation = <
  TData,
  TVariables extends OperationVariables,
  TContext extends DefaultContext = {}
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables, TContext>
): UseMutationReturn<TData, TVariables> => {
  const ctx = useGraphQLClientContext();

  const data = useSignal<Promise<TData> | undefined>();

  const mutationString = print(mutation);

  const executeMutation$ = $(async (variables: TVariables) => {
    const client = options?.clientMaker$
      ? await options.clientMaker$()
      : ctx.client;
    if (!client) {
      throw new Error("No client");
    }

    // todo! - test if this actually works
    if (typeof options?.optimisticResponse$ === "function") {
      options.optimisticResponse$ = await (
        options.optimisticResponse$ as QRL<(vars: TVariables) => TData>
      )(variables);
    }

    data.value = new Promise<TData>((resolve, reject) => {
      const mutation = client.mutate<TData, TVariables, TContext>({
        mutation: gql`
          ${mutationString}
        `,
        variables,
        ...options,
        optimisticResponse: options?.optimisticResponse$ as TData | undefined,
      });

      mutation
        .then(async (result) => {
          if (result.data) {
            if (result.errors) {
              options?.onError$ &&
                (await options.onError$(
                  new ApolloError({ graphQLErrors: result.errors }),
                  options
                ));

              if (options?.errorPolicy !== "ignore") reject(result.errors);
            }

            options?.onCompleted$ && (await options.onCompleted$(result.data));
            resolve(result.data);
          }

          if (result.errors) {
            options?.onError$ &&
              (await options.onError$(
                new ApolloError({ graphQLErrors: result.errors }),
                options
              ));
            reject(result.errors);
          }

          options?.onError$ &&
            (await options.onError$(
              new ApolloError({ graphQLErrors: result.errors }),
              options
            ));
          reject(result.errors);
        })
        .catch(async (error) => {
          options?.onError$ && (await options.onError$(error, options));
          reject(error);
        });
    });
  });

  return { executeMutation$, data };
};
export type UseMutationReturn<TData, TVariables> = {
  executeMutation$: QRL<(variables: TVariables) => Promise<void>>;
  data: Signal<Promise<TData> | undefined>;
};
