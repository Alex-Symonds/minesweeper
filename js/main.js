class MinesweeperGame extends React.Component{
    constructor(props){
        super(props);
        this.updateProgress = this.updateProgress.bind(this);
        this.setGameOver = this.setGameOver.bind(this);
        this.updateFlagCounter = this.updateFlagCounter.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleMenuMode = this.toggleMenuMode.bind(this);

        this.state = {
            gameId: 1,
            gameOver: false,
            flagCounter: 0,
            isMenuMode: false,
            maxSafeTiles: props.numRows * props.numCols - props.numMines,
            safeTilesRemaining: props.numRows * props.numCols - props.numMines
        }
    }

    reset(){
        this.setState((state) => { 
            return { 
                ...state,
                gameId: state.gameId + 1,
                gameOver: false,
                flagCounter: 0,
                safeTilesRemaining: state.maxSafeTiles 
            }})
    }

    updateProgress(){
        if(this.state.safeTilesRemaining === 1){
            this.setGameOver();
        }
        this.updateSafeTiles(-1);
    }

    setGameOver(){
        this.setState((state) => { return { ...state, gameOver: true }})
    }

    updateSafeTiles(change){
        this.setState((state) => { return { ...state, safeTilesRemaining: state.safeTilesRemaining + change }})
    }

    updateFlagCounter(change){
        this.setState((state) => { return { ...state, flagCounter: state.flagCounter + change } })
    }

    toggleMenuMode(){
        this.setState((state) => {return { ...state, isMenuMode: !state.isMenuMode}});
    }
    
    render(){
        return (
            <div class="minesweeper">
                <h1>MINESWEEPER</h1>
                <Status totalMines = {this.props.numMines}
                        flagCount = {this.state.flagCounter}
                        safeTilesRemaining = {this.state.safeTilesRemaining}
                        reset = {this.reset}
                        isMenuMode = {this.state.isMenuMode}
                        toggleMenuMode = {this.toggleMenuMode}
                />
                <Board  numRows = {this.props.numRows}
                        numCols = {this.props.numCols}
                        numMines = {this.props.numMines}
                        gameId = {this.state.gameId}
                        updateProgress = {this.updateProgress}
                        updateFlagCounter = {this.updateFlagCounter}
                        setGameOver = {this.setGameOver}
                        isGameOver = {this.state.gameOver}
                        safeTilesRemaining = {this.state.safeTilesRemaining}
                        isMenuMode = {this.state.isMenuMode}
                        toggleMenuMode = {this.toggleMenuMode}
                />
                <ResultUI   safeTilesRemaining = {this.state.safeTilesRemaining}
                            isGameOver = {this.state.gameOver} 
                />
            </div>
        );
    }
}

class Status extends React.Component{
    render(){
        return(
            <section class="panel statusControls">
                <h2>MISSION STATUS</h2>
                <ProgressUI totalMines = {this.props.totalMines}
                            flagCount = {this.props.flagCount}
                            safeTilesRemaining = {this.props.safeTilesRemaining}/>
                <section class="controls">
                    <MenuToggle     toggleMenuMode = {this.props.toggleMenuMode}
                                    isMenuMode = {this.props.isMenuMode}
                    />
                    <ResetGame reset={this.props.reset}/>
                </section>
            </section>
        )
    }
}

class ProgressUI extends React.Component{
    render(){
        const tooManyFlags = this.props.flagCount > this.props.totalMines;
        const cssClassError = tooManyFlags ? ' error' : '';

        return (
            <section class="progress">
                <p><span class="label">mines (flagged/total)</span><span class={"value" + cssClassError}>{this.props.flagCount}/{this.props.totalMines}</span></p>
                <p><span class="label">safe tiles remaining</span><span class="value">{this.props.safeTilesRemaining}</span></p>
            </section>
        );
    }
}


class MenuToggle extends React.Component{
    render(){
        return (
            <div class="labelledToggle">
                <label>input mode</label>
                <button class="toggle" onClick={this.props.toggleMenuMode}>
                    <ToggleOption   displayText = 'mouse'
                                    isActive = {!this.props.isMenuMode}
                                    />
                    <ToggleOption   displayText = 'menu'
                                    isActive = {this.props.isMenuMode}
                                    />
                </button>
            </div>
        );
    }
}

class ToggleOption extends React.Component{
    render(){
        const cssActiveOption = 'toggleActive';
        const cssInactiveOption = 'toggleInactive';
        return(
            <span class={this.props.isActive ? cssActiveOption : cssInactiveOption}>{this.props.displayText}</span>
        )
    }
}

class ResetGame extends React.Component{
    render(){
        return(
            <button class="btn" onClick={this.props.reset}>
                reset
            </button>
        )
    }
}

class ResultUI extends React.Component{
    render(){
        if(!this.props.isGameOver) return null;

        const won = this.props.safeTilesRemaining === 0;
        const resultClass = won ? "win" : "loss";
        const status = won ? "success" : "failure";
        const message = won ? "lives saved: incalculable. congratulations++" : "explosions chaining. all hope lost. goodb-"
        
        return(
            <section class={'panel result ' + resultClass}>
                <h2>MISSION RESULT</h2>
                <h3>{status.toUpperCase()}</h3>
                <p>{message}</p>
            </section>
        );
    }
}





ReactDOM.render(<MinesweeperGame numRows={10} numCols={10} numMines={10} />, document.querySelector(".root"));