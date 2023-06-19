export {
  ApolloClient,
  InMemoryCache,
  gql,
  ApolloLink,
  HttpLink,
  concat,
} from "@apollo/client/core";
export {
  GraphQLClientProvider,
  useGraphQLClientContext as useApolloClient,
} from "./components/provider/qwik-graphql-client";
export {
  useQuery,
  type QueryHookOptions,
  type ClientGenerator,
} from "./hooks/useQuery";
export { useLazyQuery } from "./hooks/useLazyQuery";
export { useMutation } from "./hooks/useMutation";
