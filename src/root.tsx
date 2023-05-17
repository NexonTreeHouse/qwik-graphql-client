import {
  ApolloLink,
  HttpLink,
  InMemoryCache,
  concat,
  gql,
} from "@apollo/client/core";
import { GraphQLClientProvider, ApolloClient } from ".";

import { Resource, $, useStore } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import { useMutation } from "./hooks/useMutation";

export default () => {
  const clientMaker$ = $(() => {
    const httpLink = new HttpLink({
      uri: "https://tradition-non-license-individually.trycloudflare.com/graphql",
    });
    const middleware = new ApolloLink((operation, forward) => {
      console.log("operation", operation);
      return forward(operation);
    });

    const requestMiddleware = new ApolloLink((operation, forward) => {
      console.log("request", operation);
      return forward(operation);
    });

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: requestMiddleware.concat(concat(middleware, httpLink)),
    });
  });

  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body>
        <GraphQLClientProvider clientGenerator$={clientMaker$}>
          <Child></Child>
        </GraphQLClientProvider>
      </body>
    </>
  );
};

export const Child = component$(() => {
  const variables = useStore({ code: "US" });
  const { executeMutation$, data } = useMutation<string, {}>(
    gql`
      mutation x {
        createHuman(
          newHuman: {
            name: "Zara Calder-Marshall"
            appearsIn: "JEDI"
            homePlanet: "Uranus"
          }
        ) {
          name
          homePlanet
        }
      }
    `,
    {
      onError$: $((e) => {
        console.log(JSON.stringify(e, null, 2));
      }),
      onCompleted$: $((data) => {
        console.log(data);
      }),
    }
  );

  return (
    <div style={{ fontSize: "2rem" }}>
      <input
        type="text"
        style={{ fontSize: "2rem", margin: "em" }}
        onInput$={(_, t) => (variables.code = t.value)}
      />
      <button
        style={{ fontSize: "2rem", margin: "em" }}
        onClick$={() => {
          executeMutation$(variables);
        }}
      >
        Fetch
      </button>
      {data.value && (
        <Resource
          value={data}
          onResolved={(v) => <pre>Resolve: {JSON.stringify(v, null, 2)}</pre>}
          onRejected={(e) => <pre>Error: {JSON.stringify(e, null, 2)}</pre>}
          onPending={() => <pre>pending</pre>}
        ></Resource>
      )}
    </div>
  );
});
