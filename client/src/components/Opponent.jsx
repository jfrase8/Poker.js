import React from 'react';

const Opponent = (props) => {
    let chooseColor = "notOpponentsTurn";
    if (props.isYourTurn)
        chooseColor = "opponentsTurn";
    else if (props.status === "Folded")
        chooseColor = "opponentFolded";
    else if (props.status === "Lost")
        chooseColor = "Lost";

    console.log(`${props.status}`);
    return(
        <>
            <div className={`opponent opponent${props.cssOrderNum} ${chooseColor} `}>
                <div className='opponentInfo'>
                    <div className='yourName' style={{backgroundColor: props.status !== "Folded" ? props.color: "gray"}}>{props.name}</div>
                    <div className='chipAmount'>{"Chips: " + props.chipAmount}</div>
                    <div className='opponentCardArea' style={{opacity: props.status !== "Folded" ? 1.0: 0.25}}>
                        <div className='opponentCard'></div>
                        <div className='opponentCard'></div>
                    </div>
                </div>
                <div className='betArea'>
                    <div className='betAmount'>{props.currentAction}</div>
                    <div className='betAmount'>{props.currentBet}</div>
                </div>
            </div>
        </>
    );
};

export default Opponent;