class Controls extends React.Component{
    render(){
        return (
            <section className="panel controls">
                <h2>CONTROLS</h2>

                <div className="controls-row">
                    <div className="controls-row__title">
                        <span>colour theme</span>
                    </div>
                    <ThemeToggleButton  setTheme = {this.props.setTheme} 
                                        theme = {this.props.theme}
                    />
                </div>

                <div className="controls-row" role="radiogroup" aria-labelledby="inputMode_label_id">
                    <div className="controls-row__title" id="inputMode_label_id">
                        <span>input mode</span>
                    </div>
                    <MenuToggleUI   inputMode = {this.props.inputMode}
                                    setInputMode = {this.props.setInputMode}     
                    />
                </div>

                <div className="controls-row">
                    <div className="controls-row__title">
                        <span>board status</span>
                    </div>
                    {this.props.inputMode === InputMode.keyboard &&
                        <EnterBoardButton inputMode = {this.props.inputMode} />
                    }
                    <ResetGameButtonUI reset={this.props.reset}
                    />
                </div>

            </section>
        )
    }
}


class MenuToggleUI extends React.Component{
    render(){
        return (
            <>
                <InputOptionRadio   activeInputMode = {this.props.inputMode}
                                    cssPositionClass = {" first"}
                                    myInputMode = {InputMode.mouse}
                                    setInputMode = {this.props.setInputMode}
                                    />
                <InputOptionRadio   activeInputMode = {this.props.inputMode}
                                    cssPositionClass = {""}
                                    myInputMode = {InputMode.touch}
                                    setInputMode = {this.props.setInputMode}
                                    />
                <InputOptionRadio   activeInputMode = {this.props.inputMode}
                                    cssPositionClass = {" last"}
                                    myInputMode = {InputMode.keyboard}
                                    setInputMode = {this.props.setInputMode}
                                    />
            </>

        );
    }
}


class InputOptionRadio extends React.Component{
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(){
        this.props.setInputMode(this.props.myInputMode);
    }

    render(){
        const isActive = this.props.myInputMode === this.props.activeInputMode;
        return(
            <div className={"radioWrapper" + this.props.cssPositionClass}>
                <input type="radio" id={this.props.myInputMode.name + "_id"} name="input_mode_name" value={this.props.myInputMode.name} checked={isActive} onChange={this.handleChange}></input>
                <label htmlFor={this.props.myInputMode.name + "_id"}><span>{this.props.myInputMode.name}</span></label>
            </div>
        )
    }
}

class ThemeToggleButton extends React.Component{
    constructor(props){
        super(props);
        this.toggleTheme = this.toggleTheme.bind(this);
    }

    toggleTheme(){
        if(this.props.theme === DARK){
            this.props.setTheme(LIGHT);
        }
        else {
            this.props.setTheme(DARK);
        }
    }

    render(){
        const thisMode = this.props.theme === DARK ? "dark" : "light";
        const otherMode = this.props.theme === DARK ? "light" : "dark";
        const screenReaderDesc = `${thisMode} mode is active: click to switch to ${otherMode} mode`;

        return (
            <button className="theme-toggle" onClick={this.toggleTheme}>
                <div className="option first"></div>
                <div className="divider"><span>{screenReaderDesc}</span></div>
                <div className="option last"></div>
            </button>
        );
    }
}


class EnterBoardButton extends React.Component{
    focusInsideBoard(){
        let myTile = document.querySelectorAll('.tile')[0];
        myTile.focus();
    }

    render(){
        return(
            <button className="btn enterBoard" onClick={this.focusInsideBoard}>
                <span>enter</span>
            </button>
        )
    }
}


class ResetGameButtonUI extends React.Component{
    render(){
        return(
            <button className="btn reset" id="reset_btn_id" onClick={this.props.reset}>
                <span>reset</span>
            </button>
        )
    }
}
