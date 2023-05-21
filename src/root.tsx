import { ApolloClient, InMemoryCache, gql, useQuery } from ".";
import { GraphQLClientProvider } from "./components/provider/qwik-graphql-client";
import { $, Resource, component$, useStore } from "@builder.io/qwik";

export default () => {
  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body>
        <GraphQLClientProvider
          clientGenerator$={$(() => {
            return new ApolloClient({
              cache: new InMemoryCache(),
              uri: "https://countries.trevorblades.com/graphql",
            });
          })}
        >
          <Child />
        </GraphQLClientProvider>
      </body>
    </>
  );
};

export const Child = component$(() => {
  const variables = useStore({ code: "AU" });
  const query = useQuery<
    {
      country: { capital: string };
    },
    { code: string }
  >(
    gql`
      query ($code: ID!) {
        country(code: $code) {
          capital
        }
      }
    `,
    variables,
    {
      canonizeResults: true,
      context: {},
      onCompleted$: $((data) => {
        console.log("completed");
        console.log(data);
      }),
      pollInterval: 500,
    }
  );

  return (
    <>
      <input type="text" onInput$={(e, t) => (variables.code = t.value)} />
      <Resource
        value={query}
        onResolved={(value) => (
          <pre>Resolve: {JSON.stringify(value, null, 2)}</pre>
        )}
        onRejected={(error) => (
          <pre>Loading: {JSON.stringify(error, null, 2)}</pre>
        )}
        onPending={() => <div>Loading...</div>}
      ></Resource>
    </>
  );
});
