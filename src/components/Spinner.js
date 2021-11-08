import React from 'react';

// React doesn't like tables inside of <div>s so we made this function
// We can reuse this in many components
export default function ({ type }) {
  if(type === 'table') {
    return(<tbody className="spinner-border text-light text-center"></tbody>)
  } else {
    return(<div className="spinner-border text-light text-center"></div>)
  }
}
