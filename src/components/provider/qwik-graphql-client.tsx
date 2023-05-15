import {
  NoSerialize,
  QRL,
  Slot,
  component$,
  createContextId,
  noSerialize,
  useContext,
  useContextProvider,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { ApolloClient } from "@apollo/client/core";

type ClientContext = {
  client: NoSerialize<ApolloClient<any>>;
};

export const ClientContext = createContextId<ClientContext>(
  "nexontreehouse.graphql.client"
);

export const GraphQLClientProvider = component$(
  (props: { clientGenerator$: QRL<() => ApolloClient<any>> }) => {
    const state = useStore<ClientContext>({ client: undefined });

    useTask$(async () => {
      if (!state.client)
        state.client = noSerialize(await props.clientGenerator$());
    });

    useContextProvider(ClientContext, state);
    useVisibleTask$(async () => {
      if (!state.client) {
        state.client = noSerialize(await props.clientGenerator$());
      }
    });

    return <Slot />;
  }
);

export const useGraphQLClientContext = () => {
  return useContext(ClientContext);
};
