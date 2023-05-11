# qwik-graphql-request

Simple GraphQL client and hook for Qwik applications.

[![npm version](https://badge.fury.io/js/qwik-graphql-client.svg)](https://badge.fury.io/js/qwik-graphql-client)

- [qwik-graphql-request](#qwik-graphql-request)
  - [Highlights](#highlights)
  - [Installation](#installation)
  - [Qwik Start](#qwik-start)
  - [Examples](#examples)
    - [Provide Context To Entire Application](#provide-context-to-entire-application)
    - [Using Client without context provider](#using-client-without-context-provider)
    - [Passing in default headers and middleware to the client](#passing-in-default-headers-and-middleware-to-the-client)
  - [Contributing](#contributing)
    - [Contributors](#contributors)

## Highlights

- Simple GraphQL client for Qwik applications.
- Fully typesafe with GraphQL Typed Document Nodes.
- Creates one reusable GraphQL client per application.
- Built in useQuery hook to simplify GraphQL requests in Qwik.
- Works seamlessly with Qwik's `<Resource>` component.

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

Provide GraphQL client context to child components. The context will be used by the `useQuery` hook to make GraphQL requests. To reuse your client throughout your entire application you can provide it in the root component as shown [here](#provide-context-to-entire-application).

```tsx
import { GraphQLClientProvider } from "qwik-graphql-client";

export default component$(() => {
  return (
    <GraphQLClientProvider endpoint="http://localhost:2003/graphql">
      <Slot />
    </GraphQLClientProvider>
  );
});
```

Then in child components you can use the `useQuery` hook to make GraphQL requests.

```tsx
import { useQuery, gql } from "qwik-graphql-client";

export default component$(() => {
  const { executeQuery$ } = useQuery(
    gql`
      {
        hero {
          name
        }
      }
    `
  );

  const hero = useResource$(async () => await executeQuery$());

  return (
    <Resource value={hero} onResolve={() => <div>{hero.name}</div>} onPending={...} onError={...} />
  )
});
```

## Examples

### Provide Context To Entire Application

To reuse your client throughout your entire application you can provide it in the root component.

```tsx
import { GraphQLClientProvider } from "qwik-graphql-client";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>// ...</head>
      <body>
        <GraphQLClientProvider endpoint="http://localhost:2003/graphql">
          <RouterOutlet />
        </GraphQLClientProvider>
        <ServiceWorkerRegistry />
      </body>
    </QwikCityProvider>
  );
});
```

### Using Client without context provider

You can use a GraphQL client independently of the context provider. This is useful when you need to make a GraphQL request outside of a component.

```tsx
import { QwikGraphQLClient } from "qwik-graphql-client";

const client = new QwikGraphQLClient({
  endpoint: "http://localhost:2003/graphql",
});

client.request(query, { variables: {}, headers: {} });
```

### Passing in default headers and middleware to the client

You can pass in default headers and middleware that will be sent with every request in the useQuery hook.

```tsx
import { GraphQLClientProvider } from "qwik-graphql-client";

export default component$(() => {
  return (
    <GraphQLClientProvider
      endpoint="http://localhost:2003/graphql"
      requestConfig={{
        headers: { Authorization: "Bearer token" },
        requestMiddleware$: $((request) => {
          console.log(request);
          return request;
        }),
        responseMiddleware$: $((response) => {
          console.log(response);
        }),
      }}
    >
      <Slot />
    </GraphQLClientProvider>
  );
});
```

## Contributing

Contributions are welcome, please open an issue and/or create a pull request.

### Contributors

<a href="https://github.com/NexonTreeHouse/qwik-graphql-client/graphs/contributors%22%3E
<img src="https://contrib.rocks/image?repo=NexonTreeHouse/qwik-graphql-client" />
</a>
