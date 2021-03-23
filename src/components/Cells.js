import React from 'react';
import PropTypes from 'prop-types';
import css from 'styled-jsx/css';
import { range } from '../sudoku';
import { DeepOrange200, DeepOrange600, LightBlue300, LightBlue200, LightBlue100, Indigo700 } from '../COLORS';

const cellWidth = 2.5;

function getBackgroundColor({ conflict, isPeer, sameValue, isSelected }) {
  if (conflict && isPeer && sameValue) {
    return DeepOrange200;
  } else if (sameValue) {
    return LightBlue300;
  } else if (isSelected) {
    return LightBlue200;
  } else if (isPeer) {
    return LightBlue100;
  }
  return false;
}

function getFontColor({ value, conflict, prefilled }) {
  if (conflict && !prefilled) {
    return DeepOrange600;
  } else if (!prefilled && value) {
    return Indigo700;
  }
  return false;
}

// eslint-disable-next-line no-lone-blocks
{ /* language=CSS */ }
const CellStyle =css`
.cell {
    height: ${cellWidth}em;
    width: ${cellWidth}em;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    font-weight: bold;
    transition: background-color .3s ease-in-out;
}
.cell:nth-child(3n+3):not(:last-child) {
    border-right: 2px solid black;
}
.cell:not(:last-child) {
    border-right: 1px solid black;
}
.note-number {
    font-size: .6em;
    width: 33%;
    height: 33%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}
`;

const Cell = (props) => {
  const { value, onClick, isPeer, isSelected, sameValue, prefilled, notes, conflict } = props;
  const backgroundColor = getBackgroundColor({ conflict, isPeer, sameValue, isSelected });
  const fontColor = getFontColor({ conflict, prefilled, value });

  return (
    <div className="cell" onClick={onClick}>
      {
        notes ?
          range(9).map(i => (
            <div key={i} className="note-number">
              {notes.has(i + 1) && (i + 1)}
            </div>
          )) :
          value && value
      }
      <style jsx>{CellStyle}</style>
      <style jsx>
        {
          `
            .cell {
              background-color ${backgroundColor || 'initial'};
              color: ${fontColor || 'initial'};
            }
          `
        }
      </style>
    </div>
  );
};

Cell.propTypes = {
  // current number value
  value: PropTypes.number,
  // cell click handler
  onClick: PropTypes.func.isRequired,
  // if the cell is a peer of the selected cell
  isPeer: PropTypes.bool.isRequired,
  // if the cell is selected by the user
  isSelected: PropTypes.bool.isRequired,
  // current cell has the same value if the user selected cell
  sameValue: PropTypes.bool.isRequired,
  // if this was prefilled as a part of the puzzle
  prefilled: PropTypes.bool.isRequired,
  // current notes taken on the cell
  notes: PropTypes.instanceOf(Set),
  // if the current cell does not satisfy the game constraint
  conflict: PropTypes.bool.isRequired,
}

Cell.defaultProps = {
  notes: null,
  value: null,
};

export { Cell };