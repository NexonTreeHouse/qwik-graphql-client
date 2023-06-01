# qwik-graphql-request

Simple GraphQL client and hook for [Qwik](https://qwik.builder.io/) applications build upon [Apollo Client](https://www.apollographql.com/docs/react/).

[![npm version](https://badge.fury.io/js/qwik-graphql-client.svg?kill_cache=1)](https://badge.fury.io/js/qwik-graphql-client)

- [Highlights](#highlights)
- [Installation](#installation)
- [Qwik Start](#qwik-start)
- [Examples](#examples)
  - [Provide Context To Entire Application](#provide-context-to-entire-application)
  - [Using a Client Without the Context Provider](#using-a-client-without-the-context-provider)
  - [Using useLazyQuery](#using-uselazyquery)
  - [Passing in default headers and middleware to the client](#passing-in-default-headers-and-middleware-to-the-client)
  - [Enabling Apollo Client Devtools](#enabling-apollo-client-devtools)
- [Limitations](#limitations)
- [Contributing](#contributing)
  - [Contributors](#contributors)

## Highlights

- Simple GraphQL client for Qwik applications.
- Built on top of the [Apollo Client](https://www.apollographql.com/docs/react/) core.
- Fully typesafe with GraphQL Typed Document Nodes.
- Creates one reusable GraphQL client per application.
- Built in `useQuery` hook to simplify GraphQL requests in Qwik.
- Works seamlessly with Qwik's `<Resource>` component.
- Reactive to variables passed into the query.

## Installation

```sh
npm add qwik-graphql-client
```

```sh
pnpm add qwik-graphql-client
```

```sh
yarn add qwik-graphql-client
```

## Qwik Start

Provide a GraphQL client context to child components. The context will be used by hooks to make GraphQL requests. To reuse your client throughout your entire application you can provide it in the root component as shown [here](#provide-context-to-entire-application).

```tsx
import {
  GraphQLClientProvider,
  ApolloClient,
  InMemoryCache,
} from "qwik-graphql-client";

export default component$(() => {
  return (
    <GraphQLClientProvider
      clientGenerator$={() =>
        new ApolloClient({
          cache: new InMemoryCache(),
          uri: "http://localhost:2003/graphql",
        })
      }
    >
      <Slot />
    </GraphQLClientProvider>
  );
});
```

Then in child components you can use the `useQuery` hook to make GraphQL requests and consume them using Qwik's `<Resource>` component.

```tsx
import { useQuery, gql } from "qwik-graphql-client";

export default component$(() => {
  const hero = useQuery(
    gql`
      query GetCapital($episode: Episode!) {
        hero(episode: $episode) {
          name
        }
      }
    `,
    { variables: { episode: "JEDI" } }
  );

  return (
    <Resource
      value={hero}
      onResolved={(value) => <div>{value.name}</div>}
      onPending={...}
      onRejected={...}
    />
  )
});
```

## Examples

### Provide Context To Entire Application

To reuse your client throughout your entire application you can provide it in the root component.

```tsx
import {
  GraphQLClientProvider,
  ApolloClient,
  InMemoryCache,
} from "qwik-graphql-client";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>...</head>
      <body>
        <GraphQLClientProvider
          clientGenerator$={$(
            () =>
              new ApolloClient({
                cache: new InMemoryCache(),
                uri: "http://localhost:2003/graphql",
              })
          )}
        >
          <RouterOutlet />
        </GraphQLClientProvider>
        <ServiceWorkerRegistry />
      </body>
    </QwikCityProvider>
  );
});
```

### Using a Client Without the Context Provider

You can use a GraphQL a separate client independently of the context provider by passing a `clientGenerator$` function into hooks.

```tsx
import {
  QwikGraphQLClient,
  ApolloClient,
  InMemoryCache,
} from "qwik-graphql-client";

export const useHero = (episode: Episode) => {
  return useQuery(
    gql`
      query GetHero($episode: Episode!) {
        hero(episode: $episode) {
          name
        }
      }
    `,
    { variables: { episode } },
    {
      clientGenerator$: $(
        () =>
          new ApolloClient({
            cache: new InMemoryCache(),
            uri: "http://localhost:2003/graphql",
          })
      ),
    }
  );
};
```

### Using `useLazyQuery`

The `useLazyQuery` hook is also available to use. It works the same as the `useQuery` hook except it does not automatically execute the query. Instead it returns a function that can be called to execute the query.

```tsx
import { useLazyQuery, gql } from "qwik-graphql-client";

export default component$(() => {
  const {executeQuery$, data} = useLazyQuery(
    gql`
      query GetHero($episode: Episode!) {
        hero(episode: $episode) {
          name
        }
      }
    `,
    { variables: { episode: "JEDI" } }
  );

  return (
    <div>
      <button onClick={() => getHero()}>Get Hero</button>
      <Resource
        value={data}
        onResolved={(value) => <div>{value.name}</div>}
        onPending={...}
        onRejected={...}
      />
    </div>
})
```

### Passing in default headers and middleware to the client

You can pass in default headers and middleware that will be sent with every request in the useQuery hook.

```tsx
import {
  GraphQLClientProvider,
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  concat,
} from "qwik-graphql-client";

export default component$(() => {
  const clientGenerator$ = $(() => {
    const httpLink = new HttpLink({
      uri: "http://localhost:2003/graphql",
    });


    const requestMiddleware = new ApolloLink((operation, forward) => {
      console.log("request", operation);
      return forward(operation);
    });

    const responseMiddleware = new ApolloLink((operation, forward) => {
        console.log("response", operation);
        return forward(operation);
      });

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: requestMiddleware.concat(concat(middleware, httpLink)),
      headers: {
        Authorization: "Bearer 123",
      },
    });
  });

  return (
    <GraphQLClientProvider
     clientGenerator$={clientGenerator$}
    >
      <Slot />
    </GraphQLClientProvider>
  );
});
```


### Enabling Apollo Client Devtools

To enable linking to the Apollo Client Devtools browser extension ([Chrome](https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/apollo-developer-tools)), add the following line to the Apollo Client returned from the `clientGenerator$`.

```tsx
new ApolloClient({
  // Enable in development only.
  connectToDevTools: import.meta.env.DEV,
  // Enable always.
  connectToDevTools: true,
  ...
});
```

## Limitations

While this library is built on top of Apollo Client Core and the Apollo Client [docs](https://www.apollographql.com/docs/react/) can be used for further documentation, this package does not support all of the features and some features are likely not to work as expected. This is very much a work in progress. If you find a bug or would like to see a feature added please open an issue or create a pull request.

## Contributing

Contributions are welcome and appreciated, please open an issue and/or create a pull request.

### Contributors

<a href="https://github.com/nexontreehouse/qwik-graphql-client/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nexontreehouse/qwik-graphql-client&kill_cache=1" />
</a>
