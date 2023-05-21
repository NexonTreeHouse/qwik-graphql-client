export { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";
export {
  GraphQLClientProvider,
  useGraphQLClientContext as useApolloClient,
} from "./components/provider/qwik-graphql-client";
export { useQuery, type QueryHookOptions } from "./hooks/useQuery";
export { useLazyQuery } from "./hooks/useLazyQuery";
