import {
  ApolloClient,
  InMemoryCache,
  gql,
  useQuery,
  GraphQLClientProvider,
  useLazyQuery,
  useMutation,
} from ".";
import { $, Resource, component$, useStore } from "@builder.io/qwik";
import { ClientGenerator } from "./hooks/useQuery";

export default () => {
  const clientGenerator$ = $(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      uri: "https://countries.trevorblades.com/graphql",
      headers: {
        Authorization: "Bearer 123",
      },
    });
  });
  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body style="background: linear-gradient(90deg, rgba(34,193,195,1) 0%, rgba(253,187,45,1) 100%); padding: 4rem; font-family: Sans-Serif">
        <h1 style="text-align: center; margin-bottom: 2em; color: white;">
          Qwik Graphql Client
        </h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2em">
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; border: 2px solid">
            <GraphQLClientProvider clientGenerator$={clientGenerator$}>
              <h2>With Provider</h2>
              <UseQuery />
              <UseLazyQuery />
              <UseMutation />
            </GraphQLClientProvider>
          </div>
          <div style="background: white; padding: 2rem; border-radius: 0.5rem; border: 2px solid">
            <h2 class="">Without Provider</h2>
            <UseLazyQuery clientGenerator$={clientGenerator$} />
            <UseMutation clientGenerator$={clientGenerator$} />
          </div>
        </div>
      </body>
    </>
  );
};

export const UseLazyQuery = component$(
  (props: { clientGenerator$?: ClientGenerator }) => {
    const variables = useStore({ code: "AU" });
    const query = useLazyQuery(
      gql`
        query ($code: ID!) {
          country(code: $code) {
            capital
          }
        }
      `,
      {
        clientGenerator$: props.clientGenerator$,
      }
    );
    return (
      <>
        <h3>useLazyQuery</h3>
        <input
          type="text"
          onInput$={(_, t) => {
            variables.code = t.value;
          }}
          value={variables.code}
        />
        <button
          type="button"
          onClick$={async () => {
            await query.executeQuery$(variables);
          }}
        >
          Execute query
        </button>
        <Resource
          value={query.data}
          onResolved={(v) => <pre>{JSON.stringify(v, null, 2)}</pre>}
          onRejected={(v) => <pre>{JSON.stringify(v, null, 2)}</pre>}
        />
      </>
    );
  }
);
export const UseMutation = component$(
  (props: { clientGenerator$?: ClientGenerator }) => {
    const variables = useStore({ code: "AU" });
    const query = useMutation(
      gql`
        mutation ($code: ID!) {
          country(code: $code) {
            capital
          }
        }
      `,
      {
        clientGenerator$: props.clientGenerator$,
        onCompleted$: $((data: any) => {
          console.log("completed: ", data);
        }),
        onError$: $((data: any) => {
          console.log("error: ", data);
        }),
      }
    );
    return (
      <>
        <h3>useMutation</h3>
        <input
          type="text"
          onInput$={(_, t) => {
            variables.code = t.value;
          }}
          value={variables.code}
        />
        <button
          type="button"
          onClick$={async () => {
            await query.executeMutation$(variables);
          }}
        >
          Execute Mutation
        </button>
        <Resource
          value={query.data}
          onResolved={(v) => <pre>{JSON.stringify(v, null, 2)}</pre>}
          onRejected={(v) => <pre>{JSON.stringify(v, null, 2)}</pre>}
        />
      </>
    );
  }
);

export const UseQuery = component$(() => {
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
        console.log("completed: ", data);
        console.log(data);
      }),
      onError$: $((data) => {
        console.log("error: ", data);
      }),
      pollInterval: 500,
    }
  );

  return (
    <>
      <h3>UseQuery</h3>
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
