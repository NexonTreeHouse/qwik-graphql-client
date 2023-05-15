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
import { useLazyQuery } from "./hooks/useLazyQuery";

export default () => {
  const clientMaker$ = $(() => {
    const httpLink = new HttpLink({
      uri: "https://countries.trevorblades.com/graphql",
    });
    const middleware = new ApolloLink((operation, forward) => {
      return forward(operation);
    });

    const requestMiddleware = new ApolloLink((operation, forward) => {
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
  const { executeQuery$, data } = useLazyQuery(gql`
    query Country($code: ID!) {
      country(code: $code) {
        name
        capital
      }
    }
  `);

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
          executeQuery$(variables);
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
