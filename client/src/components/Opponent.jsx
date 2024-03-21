import React, { useEffect, useState } from 'react';
import socket from '../socket';

const Opponent = (props) => {
    console.log(props.cssOrderNum);
    console.log(props.turnNumber);
    let chooseColor = "notOpponentsTurn";
    if (props.isYourTurn)
        chooseColor = "opponentsTurn";

    // <div className='betArea'>BetArea</div>
    return(
        <>
            <div className={`opponent opponent${props.cssOrderNum} ${chooseColor}`}>
                <div className='opponentInfo'>
                    <div className='yourName'>{props.name}</div>
                    <div className='chipAmount'>{"Chips:" + props.chipAmount}</div>
                    <div className='opponentCardArea'>
                        <div className='opponentCard'></div>
                        <div className='opponentCard'></div>
                    </div>
                </div>
                
            </div>
        </>
    );
};

export default Opponent;