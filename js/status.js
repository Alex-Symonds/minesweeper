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