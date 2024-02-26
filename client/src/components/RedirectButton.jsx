import React from "react";
import { useNavigate } from "react-router-dom";

function RedirectButton(props) {
    const navigate = useNavigate();

    function handleClick(){
        navigate(props.to)
    }

    return <button id={props.id} onClick={handleClick}>{props.label}</button>;
}

export default RedirectButton;