import './index.css';
import './stars.css';
import { useState } from 'react';

const _origin = "https://localhost:4561";

async function api(resource, options) {
    const dest = _origin + (resource[0] === "/" ? "" : "/") + resource;

    return fetch(dest, options);
}


function StarsBackground() {
    return (
        <div className="starsBackground">
            <div className="stars1 starsAnim1"></div>
            <div className="stars2 starsAnim2"></div>
            <div className="stars3 starsAnim3"></div>
        </div>

    );
}

function Banner({titleText, subtitleText, logo}) {
    return (
        <div className="bannerDiv">
            <h1 className="bannerTitle"><span className="logo">{logo}</span>{titleText}</h1>
            <p className="bannerSubtitle">{subtitleText}</p>
        </div>

    );
}

function Hide({children}) {
    return (
        <div className="hideDiv">
            {children}
        </div>
    );
}

function TextInput({label, type = "text", htmlID, value="", setter}) {
    if (!htmlID) {
        console.log("Warning: TextInput doesn't have an htmlID");
    }

    if (type != "text" && type != "password") {
        throw new Error(`Invalid TextInput type: ${type}`);
    }

    let labelElement = null;
    if (label) {
        labelElement = <label 
            className="textInputLabel"
            id={htmlID + "label"}
            htmlFor={htmlID}
        >{label}</label>;
    }

    return (
        <div className={"textInputDiv"}>
            {labelElement}
            <input
                className="textInputInput"
                type={type}
                id={htmlID}
                onChange={(e) => {
                    e.stopPropagation();
                    setter(e.target.value);
                }}
                value={value}
            />
        </div>
    );

}

function Button({children, onClick, color="white"}) {
    if (color != "white" && color != "lblue") {
        throw new Error(`Invalid button color: ${color}`);
    }

    const colorClass = "button-" + color;

    return (
        <button
            className={"loginButton " + colorClass}
            onClick={onClick}
        >
            {children}
        </button>
    );
}


function LoginBubble({onShowRegister, textContext, warningText, onLogin}) {
    return (
        <div className="loginBubble">
            <p className="loginBubbleTopText"></p>
            <div className="spacer-pTop"></div>

            <TextInput
                label="Username"
                value={textContext.username[0]}
                setter={textContext.username[1]}
                htmlID="username"
            />

            <TextInput
                label="Password"
                type="password"
                value={textContext.password1[0]}
                setter={textContext.password1[1]}
                htmlID="password"
            />
            <div className="spacer-labelSize"></div>

            <Button color="lblue" onClick={onLogin}>Login</Button>
            <div className="spacer-pButton"></div>
            <p className="pWarning">{warningText}</p>

            <Hide>
                <TextInput
                    label="asd"
                    htmlID="hiddenInput1"
                />
            </Hide>

            <div className="spacer-sectionSeparator"></div>

            <p>Need an account?</p>
            <div className="spacer-pButton"></div>
            <Button onClick={onShowRegister}>Create account</Button>
        </div>
    );
}

function RegisterBubble({onShowLogin, textContext, warningText, onRegister}) {
    return (
        <div className="loginBubble">

            <p className="loginBubbleTopText">Create account</p>
            <div className="spacer-pTop"></div>

            <TextInput
                label="Username"
                htmlID="username"
                value={textContext.username[0]}
                setter={textContext.username[1]}
            />

            <TextInput
                label="Password"
                type="password"
                htmlID="password"
                value={textContext.password1[0]}
                setter={textContext.password1[1]}
            />

            <TextInput
                label="Password (again)"
                type="password"
                htmlID="passwordAgain"
                value={textContext.password2[0]}
                setter={textContext.password2[1]}
            />

            <div className="spacer-labelSize"></div>


            <Button
                color="lblue"
                onClick={onRegister}
            >
                Register
            </Button>

            <div className="spacer-pButton"></div>
            <p className="pWarning">{warningText}</p>

            <div className="spacer-sectionSeparator"></div>

            <p></p>
            <div className="spacer-pButton"></div>
            <Button onClick={onShowLogin}>Back</Button>
        </div>
    );
}


function MainTable({children}) {
    return (
        <div className="mainTable">
            <div className="mainTableCell">
                {children}
            </div>
        </div>
    );
}

export default function App() {
    const [showRegister, setShowRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const [warningText, setWarningText] = useState("");

    async function handleRegister(e) {
        e.stopPropagation();

        if (password1 != password2) {
            setWarningText("Passwords don't match");
        } else {
            setWarningText("");

            console.log(`${username} ${password1}`);


            api("/register", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    username: username,
                    password: password1,
                }),
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then((response) => {
                console.log(response.status);
                return response.json();
            })
            .then((json) => {
                console.log("SUCCESS");
                console.log(json);
            })
            .catch((err) => {
                console.log("ERROR");
                console.log(err);
            });
        }
    }

    async function handleLogin(e) {
        e.stopPropagation();

        api("/login",{
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                password: password1,
            }),
        })
        .then((response) => {
            console.log(response.status);
            return response.json();
        })
        .then((json) => {
            console.log(json);
        }).catch((err) => {
            console.log("ERROR");
            console.log(err);
        });
    }

    async function handleInfo(e) {
        e.stopPropagation();

        api("/info", {
            method: "GET",
            credentials: "include",
        })
        .then((response) => {
            return response.json();
        }).then((json) => {
            console.log(json);
        });

    }

    async function handleApiTest(e) {
        e.stopPropagation();

        api("/api/test", {
            method: "GET",
            credentials: "include",
        }).then((response) => {
            console.log(response.status);
            return response.json();
        }).then((json) => {
            console.log(json);
        });
    }

    async function handleLogout(e) {
        e.stopPropagation();
        document.cookie = "token=;expires=1970 Jan 1;SameSite=strict;";
    }
    
    const handleShowRegister = (e) => {
        e.stopPropagation();
        setShowRegister(true);
        setUsername("");
        setPassword1("");
        setPassword2("");
        setWarningText("");
    }

    const handleShowLogin = (e) => {
        e.stopPropagation();
        setShowRegister(false);
        setUsername("");
        setPassword1("");
        setPassword2("");
        setWarningText("");
    }

    const textContext = {
        username: [username, setUsername],
        password1: [password1, setPassword1],
        password2: [password2, setPassword2],
    };

    return (
        <>
            <StarsBackground />
            <Banner
                titleText="Rocket Journal"
                logo="🚀"
                subtitleText="Your simple daily planner"
            />
            <button onClick={handleInfo} style={{color: "black"}}>INFO</button>
            <button onClick={handleLogout} style={{color: "black"}}>LOGOUT</button>
            <button onClick={handleApiTest} style={{color: "black"}}>/api</button>
            <MainTable>
                {showRegister ?
                    <RegisterBubble
                        onShowLogin={handleShowLogin}
                        textContext={textContext}
                        warningText={warningText}
                        onRegister={handleRegister}
                    />
                    :
                    <LoginBubble 
                        onShowRegister={handleShowRegister}
                        textContext={textContext}
                        warningText={warningText}
                        onLogin={handleLogin}
                    />
                }
            </MainTable>

        </>
    );

}
