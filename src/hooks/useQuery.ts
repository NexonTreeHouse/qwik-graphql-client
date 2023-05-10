import { useContext, $ } from "@builder.io/qwik";
import type { RequestDocument, Variables } from "graphql-request";
import { ClientContext } from "../components/client-provider";

export default function useQuery<T = unknown>(query: RequestDocument) {
  const clientContext = useContext(ClientContext);
  const queryString = query.toString();

  const executeQuery$ = $(
    async (config: {
      variables?: Variables;
      signal?: AbortSignal;
      headers?: Headers;
    }) => {
      try {
        return await clientContext.client!.request<T>(
          queryString,
          config.variables,
          config.headers,
          config.signal
        );
      } catch (error) {
        return Promise.reject(JSON.stringify(error, null, 2));
      }
    }
  );

  return executeQuery$;
}
