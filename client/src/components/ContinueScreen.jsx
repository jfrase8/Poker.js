import React from 'react';

const ContinueScreen = ({show, message, onClose}) => {

    return( 
        <>
            {
                show && (
                    <div className='continueScreen'>
                        <p className='continueScreenText'>{message}</p>
                        <button className='continueButton' onClick={onClose}>{"Continue"}</button>
                    </div>
                )
            }
        </>
    )
}

export default ContinueScreen;