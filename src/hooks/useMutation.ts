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
import { QRL, $, useSignal } from "@builder.io/qwik";
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
  onError$?: QRL<(error: ApolloError) => void>;
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

    const mutation = await client.mutate<TData, TVariables, TContext>({
      mutation: gql`
        ${mutationString}
      `,
      variables,
      ...options,
    });

    if (mutation.data) {
      data.value = Promise.resolve(mutation.data);
    } else {
      data.value = Promise.reject(mutation.errors);
    }
  });

  return { executeMutation$, data };
};
