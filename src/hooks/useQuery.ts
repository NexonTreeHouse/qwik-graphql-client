import { useContext, $ } from "@builder.io/qwik";
import { type RequestDocument, type Variables } from "graphql-request";
import { ClientContext } from "../components/client-provider";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";

export default function useQuery<T = unknown, V extends Variables = Variables>(
  query: RequestDocument | TypedDocumentNode<T, V>
) {
  const clientContext = useContext(ClientContext);

  let queryString: string;
  if (typeof query === "string") {
    queryString = query;
  } else {
    queryString = print(query);
  }

  const executeQuery$ = $(
    async (
      config?: Partial<{
        variables: V;
        signal: AbortSignal;
        headers: Headers;
      }>
    ) => {
      try {
        return await clientContext.client!.request<T>(
          queryString,
          config?.variables,
          config?.headers,
          config?.signal
        );
      } catch (error) {
        return Promise.reject(error);
      }
    }
  );

  return { executeQuery$ };
}
