import React, { useEffect, useState } from 'react';
import socket from '../socket';

const Opponent = (props) => {
    let chooseColor = "notOpponentsTurn";
    if (props.isYourTurn)
        chooseColor = "opponentsTurn";

    // 
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
                <div className='betArea'>BetArea</div>
            </div>
        </>
    );
};

export default Opponent;