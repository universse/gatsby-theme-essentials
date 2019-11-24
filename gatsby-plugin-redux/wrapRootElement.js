import React from 'react'
import { Provider } from 'react-redux'

import configureStore from './configureStore'

const store = configureStore()

// eslint-disable-next-line
export default ({ element }) => <Provider store={store}>{element}</Provider>
