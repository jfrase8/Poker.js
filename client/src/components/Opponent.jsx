import React, {useEffect, useState} from 'react';

const Opponent = (props) => {

    const [revealAnim1, setRevealAnim1] = useState({});
    const [revealAnim2, setRevealAnim2] = useState({});

    var background1 = `url("../Cards/${props.cards[0].value}_of_${props.cards[0].suit}.png")`;
    var background2 = `url("../Cards/${props.cards[1].value}_of_${props.cards[1].suit}.png")`;

    useEffect(() => {
        if (props.opponentReveal) {
            console.log("Reveal Cards");
            if (props.status !== 'Folded') {
                setRevealAnim1({backgroundImage: background1, animation: 'reveal 1s forwards'});
                setRevealAnim2({backgroundImage: background2, animation: 'reveal 1s forwards'});
            }
        }
    }, [props.opponentReveal]);

    let chooseColor = "notOpponentsTurn";
    if (props.isYourTurn)
        chooseColor = "opponentsTurn";
    else if (props.status === "Folded")
        chooseColor = "opponentFolded";
    else if (props.status === "Lost")
        chooseColor = "Lost";

    return(
        <>
            <div className={`opponent opponent${props.cssOrderNum} ${chooseColor} `}>
                <div className='opponentInfo'>
                    <div className='yourName' style={{backgroundColor: props.status !== "Folded" ? props.color: "gray"}}>{props.name}</div>
                    <div className='chipAmount'>{"Chips: " + props.chipAmount}</div>
                    <div className='opponentCardArea' style={{opacity: props.status !== "Folded" ? 1.0: 0.25}}>
                        <div className='opponentCardBack'>
                            <div className='opponentCardFront' style={revealAnim1}></div>
                        </div>
                        <div className='opponentCardBack'>
                            <div className='opponentCardFront' style={revealAnim2}></div>
                        </div>
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