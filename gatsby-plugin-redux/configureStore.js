import { createStore, compose, applyMiddleware, combineReducers } from 'redux'
// import thunk from 'redux-thunk'

import reducerRegistry from '../../src/reducerRegistry'

const combine = (reducers, preloadedState) => {
  const reducerNames = Object.keys(reducers)

  Object.keys(preloadedState).forEach(item => {
    if (reducerNames.indexOf(item) === -1) {
      reducers[item] = (state = null) => state
    }
  })

  return combineReducers(reducers)
}

export default (preloadedState = {}) => {
  const reducer = combine(reducerRegistry.getReducers(), preloadedState)

  const store = createStore(
    reducer,
    preloadedState,
    compose(
      // applyMiddleware(thunk),
      typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION__
        ? window.__REDUX_DEVTOOLS_EXTENSION__()
        : f => f
    )
  )

  reducerRegistry.setChangeListener(reducers => {
    store.replaceReducer(combine(reducers))
  })

  return store
}
