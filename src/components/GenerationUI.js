import React, { Component } from 'react';
import PropTypes from 'prop-types'
import Color from 'color';

const backGroundBlue = '#2233FC';

class GenerationUI extends Component {
  constructor(props) {
    super(props);

    this.state = { value: 30 };
  }

  generateGame = () => {
    this.props.generateGame(this.state.value);
  }

  render() {
    return (
      <div className="generation">
        <div className="copy">Start with {this.state.value} cells prefilled</div>
        <input
          type='number'
          value={this.state.value}
          onChange={(ev) => this.setState({ value: ev.target.value })
          }
        />
        <p>Minimo 17 - Maximo 81</p>
        <div className="button" onClick={this.generateGame}>Play Sudoku</div>
        { /* language=CSS */ }
        <style jsx>{`
            .copy {
                text-align: center;
                font-size: 1.3em;
                margin-bottom: .5em;
            }
            .generation {
                display: flex;
                justify-content: center;
                flex-direction: column;
                width: 100%;
                align-items: center;
            }
            :global(.input-range) {
                width: 80%;
                max-width: 500px;
            }
            .button {
              margin-top: .5em;
              border-radius: .25em;
              cursor: pointer;
              font-weight: bold;
              text-decoration: none;
              color: #fff;
              position: relative;
              display: inline-block;
              transition: all .25s;
              padding: 5px 10px;
              font-size: 1.4em;
            }
            .button:active {
              transform: translate(0px, 5px);
              box-shadow: 0 1px 0 0;
            }
            .button {
              background-color: ${backGroundBlue};
              box-shadow: 0 2px 4px 0 ${Color(backGroundBlue).darken(0.5).hsl().string()};
              display: flex;
              align-items: center;
            }
            .button:hover {
              background-color: ${Color(backGroundBlue).lighten(0.2).hsl().string()};
            }
        `}
        </style>
      </div>
    );
  }
}

GenerationUI.propTypes = {
  generateGame: PropTypes.func.isRequired,
};

export { GenerationUI }