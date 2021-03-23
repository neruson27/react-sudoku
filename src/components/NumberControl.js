import React from 'react';
import PropTypes from 'prop-types';
import css from 'styled-jsx/css';

import { Indigo700 } from '../COLORS';

const CircularPathD = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

const ControlNumberColor = Indigo700;

// eslint-disable-next-line no-lone-blocks
{ /* language=CSS */ }
const CirculuarProgressStyle =css`
.circular-progress {
    display: block;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    transition: filter .4s ease-in-out;
}
.circle-bg {
    fill: none;
    stroke: #eee;
    stroke-width: 3.8;
}
.circle {
    stroke: ${ControlNumberColor};
    transition: stroke-dasharray .4s ease-in-out;
    fill: none;
    stroke-width: 2.8;
    stroke-linecap: round;
}
`;

const NumberControlStyle =css`
.number {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
    font-size: 2em;
    margin: .1em;
    width: 1.5em;
    height: 1.5em;
    color: ${ControlNumberColor};
    box-shadow: 0 1px 2px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.23);
    border-radius: 50%;
}
`;

const CircularProgress = ({ percent }) => (
  <svg viewBox="0 0 36 36" className="circular-progress">
    <path
      className="circle-bg"
      d={CircularPathD}
    />
    <path
      className="circle"
      strokeDasharray={`${percent * 100}, 100`}
      d={CircularPathD}
    />
    { /* language=CSS */ }
    <style jsx>{CirculuarProgressStyle}</style>
  </svg>
);

CircularProgress.propTypes = {
  percent: PropTypes.number.isRequired,
};

const NumberControl = ({ number, onClick, completionPercentage }) => {
  return (
    <div
      key={number}
      className="number"
      onClick={onClick}
    >
      <div>{number}</div>
      <CircularProgress percent={completionPercentage} />
      <style jsx>{NumberControlStyle}</style>
    </div>
  );
}

// NumberControl.propTypes = {
//   number: PropTypes.number.isRequired,
//   onClick: PropTypes.func,
//   completionPercentage: PropTypes.number.isRequired,
// };

export { NumberControl }