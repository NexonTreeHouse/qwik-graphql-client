import type { NoSerialize, QRL } from "@builder.io/qwik";
import {
  Slot,
  component$,
  createContextId,
  noSerialize,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { GraphQLClient } from "graphql-request";
import type {
  ErrorPolicy,
  GraphQLClientRequestHeaders,
  HTTPMethodInput,
  MaybeLazy,
  RequestConfig,
  RequestMiddleware,
  Variables,
} from "graphql-request/build/esm/types";

type ClientContext = {
  client: NoSerialize<QwikGraphQLClient>;
  responseMiddleware?: ResponseMiddleware$;
};

export const ClientContext = createContextId<ClientContext>("graphql.client");

type MaybeLazy$<T> = QRL<MaybeLazy<T>>;

type RequestMiddleware$ = QRL<RequestMiddleware>;

type ResponseMiddleware$ = QRL<RequestConfig["responseMiddleware"]>;

type AdditionalRequestOptions = {
  /**
   * Decide how to handle GraphQLErrors in response
   */
  errorPolicy?: ErrorPolicy;
};

interface QwikGraphqlClientRequestConfig
  extends Omit<RequestInit, "headers" | "method" | "body" | "signal">,
    AdditionalRequestOptions {
  method?: HTTPMethodInput;
  headers?: MaybeLazy$<GraphQLClientRequestHeaders>;
  requestMiddleware?: RequestMiddleware$;
  responseMiddleware?: ResponseMiddleware$;
}

interface QwikGraphQLClientProps {
  endpoint: string;
  requestConfig?: QwikGraphqlClientRequestConfig;
}

export default component$((props: QwikGraphQLClientProps) => {
  const client = new QwikGraphQLClient(props.endpoint, props.requestConfig);

  const state = useStore<ClientContext>({
    client: noSerialize(client),
    responseMiddleware: props.requestConfig?.responseMiddleware,
  });

  useVisibleTask$(() => {
    state.client = noSerialize(
      new QwikGraphQLClient(props.endpoint, props.requestConfig)
    );

    state.responseMiddleware = props.requestConfig?.responseMiddleware;
  });

  useContextProvider(ClientContext, state);

  return <Slot />;
});

export class QwikGraphQLClient {
  private responseMiddleware: ResponseMiddleware$ | undefined;
  private client: GraphQLClient;
  constructor(url: string, requestConfig: QwikGraphqlClientRequestConfig = {}) {
    const baseRequestConfig = {
      ...requestConfig,
      responseMiddleware: undefined,
    };

    this.client = new GraphQLClient(url, baseRequestConfig as RequestConfig);
    this.responseMiddleware = requestConfig.responseMiddleware;
  }

  public async request<T>(
    query: string,
    variables?: Variables,
    requestHeaders?: GraphQLClientRequestHeaders,
    signal?: AbortSignal
  ): Promise<T> {
    const response = await this.client.rawRequest<T>({
      query,
      variables,
      requestHeaders,
      signal,
    });
    await this.responseMiddleware?.(response);
    return response.data;
  }
}
