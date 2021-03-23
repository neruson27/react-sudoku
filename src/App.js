import React, { Component } from 'react';
import { List, fromJS, Set } from 'immutable';
import css from 'styled-jsx/css';
import { makePuzzle, pluck, isPeer, range } from './sudoku';
import { Cell } from './components/Cells';
import { NumberControl } from './components/NumberControl';
import { GenerationUI } from './components/GenerationUI';
import { ReactComponent as LoupeIcon } from './svg/loupe.svg';
import { ReactComponent as RemoveIcon } from './svg/remove.svg';
import { ReactComponent as ReloadIcon } from './svg/reload.svg';
import { ReactComponent as ReturnIcon } from './svg/return.svg';
const cellWidth = 2.5;

// eslint-disable-next-line no-lone-blocks
{ /* language=CSS */ }
const PuzzleStyle =css`
.puzzle {
    margin-top: .5em;
    width: ${cellWidth * 9}em;
    cursor: pointer;
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
}
.row {
    display: flex;
    align-items: center;
    flex: 0;
    width: ${cellWidth * 9}em;
}
.row:not(:last-child) {
    border-bottom: 1px solid black;
}
.row:nth-child(3n+3):not(:last-child) {
    border-bottom: 2px solid black !important;
}
`;

// eslint-disable-next-line no-lone-blocks
{ /* language=CSS */ }
const ControlStyle =css`
.control {
    padding: 0 2em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    font-family: 'Special Elite', cursive;
    transition: filter .5s ease-in-out;
    width: 100%;
}
`;

// eslint-disable-next-line no-lone-blocks
{ /* language=CSS */ }
const ActionsStyle =css`
.actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    margin-top: .5em;
    padding: 0 .6em;
}
.action {
    display: flex;
    align-items: center;
    flex-direction: column;
}
.action :global(svg) {
    width: 2.5em;
    margin-bottom: .2em;
}
.redo :global(svg) {
    transform: scaleX(-1);
}
`;

/**
 * make size 9 array of 0s
 * @returns {Array}
 */
function makeCountObject() {
  const countObj = [];
  for (let i = 0; i < 10; i += 1) countObj.push(0);
  return countObj;
}

/**
 * given a 2D array of numbers as the initial puzzle, generate the initial game state
 * @param puzzle
 * @returns {any}
 */
function makeBoard({ puzzle }) {
  // create initial count object to keep track of conflicts per number value
  const rows = Array.from(Array(9).keys()).map(() => makeCountObject());
  const columns = Array.from(Array(9).keys()).map(() => makeCountObject());
  const squares = Array.from(Array(9).keys()).map(() => makeCountObject());
  const result = puzzle.map((row, i) => (
    row.map((cell, j) => {
      if (cell) {
        rows[i][cell] += 1;
        columns[j][cell] += 1;
        squares[((Math.floor(i / 3)) * 3) + Math.floor(j / 3)][cell] += 1;
      }
      return {
        value: puzzle[i][j] > 0 ? puzzle[i][j] : null,
        prefilled: !!puzzle[i][j],
      };
    })
  ));
  return fromJS({ puzzle: result, selected: false, choices: { rows, columns, squares } });
}

/**
 * give the coordinate update the current board with a number choice
 * @param x
 * @param y
 * @param number
 * @param fill whether to set or unset
 * @param board the immutable board given to change
 */
function updateBoardWithNumber({ x, y, number, fill = true, board}) {
  let cell = board.get('puzzle').getIn([x, y]);
  // delete its notes
  cell = cell.delete('notes');
  // set or unset its value depending on 'fill'
  cell = fill ? cell.set('value', number) : cell.delete('value');
  const increment = fill ? 1 : -1;
  // update the current group choices
  const rowPath = ['choices', 'rows', x, number];
  const columnPath = ['choices', 'columns', y, number];
  const squarePath = ['choices', 'squares', ((Math.floor(x / 3)) * 3) + Math.floor(y / 3), number];

  return board.setIn(rowPath, board.getIn(rowPath) + increment)
    .setIn(columnPath, board.getIn(columnPath) + increment)
    .setIn(squarePath, board.getIn(squarePath) + increment)
    .setIn(['puzzle', x, y], cell);
}

function getNumberOfGroupsAssignedForNumber(number, groups) {
  return groups.reduce((accumulator, row) =>
    accumulator + (row.get(number) > 0 ? 1 : 0), 0);
}

function getClickHandler(onClick, onDoubleClick, delay = 250) {
  let timeoutID = null;
  return (event) => {
    if (!timeoutID) {
      timeoutID = setTimeout(() => {
        onClick(event);
        timeoutID = null;
      }, delay);
    } else {
      timeoutID = clearTimeout(timeoutID);
      onDoubleClick(event);
    }
  };
}

class Game extends Component {
  state = {};

  getSelectedCell() {
    const { board } = this.state;
    const selected = board.get('selected');
    return selected && board.get('puzzle').getIn([selected.x, selected.y]);
  }

  // get the min between its completion in rows, columns and squares.
  getNumberValueCount(number) {
    const rows = this.state.board.getIn(['choices', 'rows']);
    const columns = this.state.board.getIn(['choices', 'columns']);
    const squares = this.state.board.getIn(['choices', 'squares']);
    return Math.min(
      getNumberOfGroupsAssignedForNumber(number, squares),
      Math.min(
        getNumberOfGroupsAssignedForNumber(number, rows),
        getNumberOfGroupsAssignedForNumber(number, columns),
      ),
    );
  }

  generateGame = (finalCount = 20) => {
    // get a filled puzzle generated
    const solution = makePuzzle();
    // pluck values from cells to create the game
    const { puzzle } = pluck(solution, finalCount);
    // initialize the board with choice counts
    const board = makeBoard({ puzzle });
    this.setState({
      board, history: List.of(board), historyOffSet: 0, solution,
    });
  }

  addNumberAsNote = (number) => {
    let { board } = this.state;
    let selectedCell = this.getSelectedCell();
    if (!selectedCell) return;
    const prefilled = selectedCell.get('prefilled');
    if (prefilled) return;
    const { x, y } = board.get('selected');
    const currentValue = selectedCell.get('value');
    if (currentValue) {
      board = updateBoardWithNumber({
        x, y, number: currentValue, fill: false, board: this.state.board,
      });
    }
    let notes = selectedCell.get('notes') || Set();
    if (notes.has(number)) {
      notes = notes.delete(number);
    } else {
      notes = notes.add(number);
    }
    selectedCell = selectedCell.set('notes', notes);
    selectedCell = selectedCell.delete('value');
    board = board.setIn(['puzzle', x, y], selectedCell);
    this.updateBoard(board);
  };

  updateBoard = (newBoard) => {
    let { history } = this.state;
    const { historyOffSet } = this.state;
    // anything before current step is still in history
    history = history.slice(0, historyOffSet + 1);
    // add itself onto the history
    history = history.push(newBoard);
    // update the game
    this.setState({ board: newBoard, history, historyOffSet: history.size - 1 });
  };

  canUndo = () => this.state.historyOffSet > 0

  redo = () => {
    const { history } = this.state;
    let { historyOffSet } = this.state;
    if (history.size) {
      historyOffSet = Math.min(history.size - 1, historyOffSet + 1);
      const board = history.get(historyOffSet);
      this.setState({ board, historyOffSet });
    }
  };

  undo = () => {
    const { history } = this.state;
    let { historyOffSet, board } = this.state;
    if (history.size) {
      historyOffSet = Math.max(0, historyOffSet - 1);
      board = history.get(historyOffSet);
      this.setState({ board, historyOffSet, history });
    }
  };

  eraseSelected = () => {
    const selectedCell = this.getSelectedCell();
    if (!selectedCell) return;
    this.fillNumber(false);
  }

  fillSelectedWithSolution = () => {
    const { board, solution } = this.state;
    const selectedCell = this.getSelectedCell();
    if (!selectedCell) return;
    const { x, y } = board.get('selected');
    this.fillNumber(solution[x][y]);
  }


  // fill currently selected cell with number
  fillNumber = (number) => {
    let { board } = this.state;
    const selectedCell = this.getSelectedCell();
    // no-op if nothing is selected
    if (!selectedCell) return;
    const prefilled = selectedCell.get('prefilled');
    // no-op if it is refilled
    if (prefilled) return;
    const { x, y } = board.get('selected');
    const currentValue = selectedCell.get('value');
    // remove the current value and update the game state
    if (currentValue) {
      board = updateBoardWithNumber({
        x, y, number: currentValue, fill: false, board: this.state.board,
      });
    }
    // update to new number if any
    const setNumber = currentValue !== number && number;
    if (setNumber) {
      board = updateBoardWithNumber({
        x, y, number, fill: true, board,
      });
    }
    this.updateBoard(board);
  };

  selectCell = (x, y) => {
    let { board } = this.state;
    board = board.set('selected', { x, y });
    this.setState({ board });
  };

  isConflict(i, j) {
    const { value } = this.state.board.getIn(['puzzle', i, j]).toJSON();
    if (!value) return false;
    const rowConflict =
      this.state.board.getIn(['choices', 'rows', i, value]) > 1;
    const columnConflict =
      this.state.board.getIn(['choices', 'columns', j, value]) > 1;
    const squareConflict =
      this.state.board.getIn(['choices', 'squares',
        ((Math.floor(i / 3)) * 3) + Math.floor(j / 3), value]) > 1;
    return rowConflict || columnConflict || squareConflict;
  }

  renderCell(cell, x, y) {
    const { board } = this.state;
    const selected = this.getSelectedCell();
    const { value, prefilled, notes } = cell.toJSON();
    const conflict = this.isConflict(x, y);
    const peer = isPeer({ x, y }, board.get('selected'));
    const sameValue = !!(selected && selected.get('value')
      && value === selected.get('value'));

    const isSelected = cell === selected;
    return (<Cell
      prefilled={prefilled}
      notes={notes}
      sameValue={sameValue}
      isSelected={isSelected}
      isPeer={peer}
      value={value}
      onClick={() => { this.selectCell(x, y); }}
      key={y}
      x={x}
      y={y}
      conflict={conflict}
    />);
  }

  renderNumberControl() {
    const selectedCell = this.getSelectedCell();
    const prefilled = selectedCell && selectedCell.get('prefilled');
    return (
      <div className="control">
        {range(9).map((i) => {
          const number = i + 1;
          // handles binding single click and double click callbacks
          const clickHandle = getClickHandler(
            () => { this.fillNumber(number); },
            () => { this.addNumberAsNote(number); },
          );
          return (
            <NumberControl
              key={number}
              number={number}
              onClick={!prefilled ? clickHandle : undefined}
              completionPercentage={this.getNumberValueCount(number) / 9}
            />);
        })}
        <style jsx>{ControlStyle}</style>
      </div>
    );
  }

  renderActions() {
    const { history } = this.state;
    const selectedCell = this.getSelectedCell();
    const prefilled = selectedCell && selectedCell.get('prefilled');
    return (
      <div className="actions">
        <div className="action" onClick={history.size ? this.undo : null}>
          <ReloadIcon />Undo
        </div>
        <div className="action redo" onClick={history.size ? this.redo : null}>
          <ReloadIcon />Redo
        </div>
        <div className="action" onClick={!prefilled ? this.eraseSelected : null}>
          <RemoveIcon />Erase
        </div>
        <div
          className="action"
          onClick={!prefilled ?
          this.fillSelectedWithSolution : null}
        >
          <LoupeIcon />Hint
        </div>
        <style jsx>{ActionsStyle}</style>
      </div>
    );
  }

  renderPuzzle() {
    const { board } = this.state;
    return (
      <div className="puzzle">
        {board.get('puzzle').map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="row">
            {
              row.map((cell, j) => this.renderCell(cell, i, j)).toArray()
            }
          </div>
        )).toArray()}
        <style jsx>{PuzzleStyle}</style>
      </div>
    );
  }

  renderControls() {
    return (
      <div className="controls">
        {this.renderNumberControl()}
        {this.renderActions()}
        { /* language=CSS */ }
        <style jsx>{`
            .controls {
                margin-top: .3em;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                width: 100%;
                padding: .5em 0;
            }
        `}
        </style>
      </div>
    );
  }

  renderGenerationUI() {
    return (
      <GenerationUI generateGame={this.generateGame} />
    );
  }

  renderHeader() {
    return (
      <div className="header">
        <div className="new-game" onClick={() => this.setState({ board: false })}>
          <ReturnIcon />
          <div>New Game</div>
        </div>
        { /* language=CSS */ }
        <style jsx>{`
            .header {
                display: flex;
                width: 100%;
                justify-content: space-between;
                max-width: 500px;
                padding: 0 0.5em;
                box-sizing: border-box;
            }
            .new-game {
                cursor: pointer;
                margin-top: .2em;
                display: inline-flex;
                justify-content: center;
                align-items: center;
                padding: .2em 0;
            }
            .new-game :global(svg) {
                height: 1em;
                margin-bottom: .3em;
            }
        `}
        </style>
      </div>
    );
  }

  render() {
    const { board } = this.state;
    return (
      <div className="body">
        {!board && this.renderGenerationUI()}
        {board && this.renderHeader()}
        {board && this.renderPuzzle()}
        {board && this.renderControls()}
        <div className="rooter">
          Made with <span>❤️</span>️ By Neru
        </div>
        { /* language=CSS */ }
        <style jsx>{`
            :global(body), .body {
                font-family: 'Special Elite', cursive;
            }
            .body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                width: 100vw;
                position: relative;
            }
            @media (min-width: 800px) and (min-height: 930px){
                :global(.header, .puzzle, .controls) {
                    font-size: 1.5em;
                }
            }
            @media (max-width: 800px) and (min-width: 600px){
                :global(.header, .puzzle, .controls) {
                    font-size: 1.2em;
                }
            }
            @media (max-height: 930px) and (min-height: 800px) and (min-width: 600px){
                :global(.header, .puzzle, .controls) {
                    font-size: 1.2em;
                }
            }
            @media (max-height: 800px) and (min-height: 600px) and (min-width: 370px){
                :global(.header, .puzzle, .controls) {
                    font-size: 1em;
                }
            }
            @media (max-width: 370px){
                :global(.header, .puzzle, .controls) {
                    font-size: .8em;
                }
            }
            @media (max-height: 600px){
                :global(.header, .puzzle, .controls) {
                    font-size: .8em;
                }
            }
            :global(body) {
                margin: 0;
            }
            .rooter {
                position: fixed;
                bottom: 0;
                font-size: .8em;
                width: 100%;
                text-align: center;
            }
        `}
        </style>
      </div>
    );
  }
}

export default Game