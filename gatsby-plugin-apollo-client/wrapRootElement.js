import React from 'react'
import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

const client = new ApolloClient({
  // uri: ''
})

// eslint-disable-next-line
export default ({ element }) => (
  <ApolloProvider client={client}>{element}</ApolloProvider>
)
