import ClientProvider, {
  QwikGraphQLClient,
} from "./components/client-provider";
import useQuery from "./hooks/useQuery";
import { gql } from "graphql-request";

export { useQuery, ClientProvider, QwikGraphQLClient, gql };
