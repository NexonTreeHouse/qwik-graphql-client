import {
  DefaultContext,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
  gql,
} from "@apollo/client/core";
import { print } from "graphql";
import { useGraphQLClientContext } from "../components/provider/qwik-graphql-client";
import { MutationHookOptions as ApolloMutationHookOptions } from "@apollo/client";
import { QRL, $ } from "@builder.io/qwik";

type MutationHookOptions<
  TData,
  TVariables extends OperationVariables,
  TContext extends DefaultContext = {}
> = Omit<
  ApolloMutationHookOptions<TData, TVariables, TContext>,
  | "mutation"
  | "variables"
  | "optimisticResponse"
  | "refetchQueries"
  | "update"
  | "onQueryUpdated"
  | "client"
  | "onCompleted"
  | "onError"
> & {
  optimisticResponse$?: TData | QRL<(vars: TVariables) => TData>;
};

export const useMutation = async <
  TData,
  TVariables extends OperationVariables,
  TContext extends DefaultContext = {}
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables, TContext>
) => {
  const ctx = useGraphQLClientContext();

  const mutationString = print(mutation);

  const executeMutation$ = $(async (variables: TVariables) => {
    const client = ctx.client;

    if (typeof options?.optimisticResponse$ === "function") {
      options.optimisticResponse$ = await (
        options.optimisticResponse$ as QRL<(vars: TVariables) => TData>
      )(variables);
    }

    client?.mutate<TData, TVariables, TContext>({
      mutation: gql`
        ${mutationString}
      `,
      variables,
      ...options,
    });
  });

  return { executeMutation$ };
};
