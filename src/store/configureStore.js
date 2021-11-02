import { createStore, applyMiddleware, compose } from 'redux' //react-redux
import { createLogger } from 'redux-logger'
import rootReducer from './reducers'

const loggerMiddleware = createLogger()
const middleware = []

// For Redux Dev Tools. Allows us to connect to our app
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(preloadedState) {
    return createStore(
        rootReducer,
        preloadedState,
        composeEnhancers(applyMiddleware(...middleware, loggerMiddleware))
    )
}