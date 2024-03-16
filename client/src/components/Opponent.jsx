import React, { useEffect, useState } from 'react';
import socket from '../socket';

const Opponent = (props) => {
    console.log(props.cssOrderNum);
    let chooseColor = "notOpponentsTurn";
    if (props.isYourTurn)
        chooseColor = "opponentsTurn";

    return(
        <>
            <div className={`opponent opponent${props.cssOrderNum} ${chooseColor}`}>
                <div className='yourName'>{props.name}</div>
                <div className='chipAmount'>{"Chips:" + props.chipAmount}</div>
            </div>
        </>
    );
};

export default Opponent;