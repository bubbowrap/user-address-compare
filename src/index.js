import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import { store } from './redux-store';
import { fetchUserIds } from './thunks'
import { App } from './components.jsx'

import { fetchInterval } from './utils';
import "./index.css";


/**
 *
 * App initialization
 *
 */
const rootElement = document.getElementById('root')

fetchInterval(fetchUserIds, 10000, 5);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
)

