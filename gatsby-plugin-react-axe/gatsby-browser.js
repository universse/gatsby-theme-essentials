import React from 'react'
import ReactDOM from 'react-dom'
import axe from 'react-axe'

export const onClientEntry = () => axe(React, ReactDOM, 1000)
