//  Apply this code when the DOM has loaded the content //
document.addEventListener('DOMContentLoaded', function(){

  //  Objectify the UI game elements
  let choice_a = document.getElementById('choice_a');
  choice_a.addEventListener('click', play_token);
  let choice_b = document.getElementById('choice_b');
  choice_b.addEventListener('click', play_token);
  let choice_c = document.getElementById('choice_c');
  choice_c.addEventListener('click', play_token);
  let choice_d = document.getElementById('choice_d');
  choice_d.addEventListener('click', play_token);
  let choice_e = document.getElementById('choice_e');
  choice_e.addEventListener('click', play_token);
  let choice_f = document.getElementById('choice_f');
  choice_f.addEventListener('click', play_token);
  let played_tokens = document.getElementById('played_tokens');
  let scoring_display = document.getElementById('scoring_display');
  let dev_corral = document.getElementById('dev_corral');
  let model_red = document.getElementById('model_red');
  let model_yellow = document.getElementById('model_yellow');
  let model_score = document.getElementsByClassName('model_score');
  let red_score = document.getElementById('red_score');
  let yellow_score = document.getElementById('yellow_score');
  let winner_circle = document.getElementById('winner_circle');
  let winner_label = document.getElementById('winner_label');

  //  Object Definitions for:
  //  - Players
  //  - Columns
  //  - Exceptions
  //  - Game Engine
  const player = {"red":"red", "yellow": "yellow"};
  const columns = {
    labels: {1:"a", 2:"b", 3:"c", 4:"d", 5:"e", 6:"f"},
    numbers: {"a":1,"b":2,"c":3,"d":4,"e":5,"f":6}
  };
  const e = {
    "wrong_player": "Invalid Turn: It is the other side's turn at the moment.",
    "column_full": "No Room: This column is completely full, please select another."
  };

  // Game Engine //
  //    This is the where the rules are validated, turns are recorded,
  //    column stacks are accumulated, and the state of the game is stored.
  let game = {
    whos_turn: player.red,
    scores: {
      red: 0,
      yellow: 0
    },
    turns: [],
    tally_sheet: [],
    columns: {
      a: [],
      b: [],
      c: [],
      d: [],
      e: [],
      f: []
    },
    game_finished: false,
    winner: false,
    row_count: 7,
    is_play_valid: (play) => {

      //  Validate whether this player go now.
      if(play.player != game.whos_turn){
        handle_it(e.wrong_player);
        return false;
      }

      //  Validate whether the selected column has enough room.
      if(!game.has_room(play.column)){
        handle_it(e.column_full);
        return false;
      }

      //  If the code arrives here, the play is valid.
      return true;
    },
    has_room: (column) => {
      //  A simple calc to see if there is room still.
      return (game.columns[column].length < game.row_count);
    },
    score_turn: async (play) => {
      //  Additional Score for Adjacent Tokens
      //  Add +7 points for the token dropped, then another +7 for each of
      //  this player's adjacent tokens.

      // Slice the adjacent tokens into a single manifest (token_block) to parse through.
      let token_block = [];
      let active_column_number = columns.numbers[play.column];
      let active_row_ndx = game.columns[play.column].length - 1;
      let low_row_ndx = Math.max(0, active_row_ndx - 1);
      let high_row_ndx = Math.min(game.row_count, active_row_ndx + 2);  // +2 because slice() doesn't include the last ndx passed.
      let left_adjacents = (active_column_number == 1) ? [] : game.columns[columns.labels[active_column_number-1]].slice(low_row_ndx,high_row_ndx);
      let right_adjacents = (active_column_number == 6) ? [] : game.columns[columns.labels[active_column_number+1]].slice(low_row_ndx,high_row_ndx);
      token_block = game.columns[play.column].slice(low_row_ndx,high_row_ndx).concat(left_adjacents, right_adjacents);

      // Iterate through the token_block to create a score tally to iterate through when scoring.
      await token_block.forEach(async (token) => {
        if(token.player == play.player) game.tally_sheet.push({points: 7, token: token});
      });

      //  Fire off the scoring phase of the interface, between each turn...
      //  displaying the scores earned for that turn.
      await scoring_phase(game.tally_sheet);
      console.log(game.tally_sheet);

      //  Search for Connect4... Four tokens of the same color in a straight
      //  line, oriented horizontally, vertically, or diagonally.
      //  *Note: Upon discovering the first Connect4, the end is declared with Connect4();

      //  Iterate through the column arrays, from left to right (a to f)...
      for(col_num = 1; col_num <= 6; col_num++){
        // Iterate through this column, from bottom position to the topmost...
        let col_ndx = columns.labels[col_num];
        for(tok_num=0;tok_num<game.row_count;tok_num++){
          let token = game.columns[col_ndx][tok_num];
          //  If there is no token at this position, it shall not pass //
          if(typeof token !== 'undefined'){
            // If this token is one of the player's, begin the search...
            if(token.player == play.player) {
              // Search up...
              let connected = []; // This will hold multiple Connect4 for future modes
              for(t=tok_num+3;t>=tok_num;t--){
                let up_token = game.columns[col_ndx][t];

                // Define the class needed to position and pop the dev check icon.
                //let action_class = `${col_ndx}${t}`;
                //let check_pop = model_score[0].cloneNode(false);  // Use the model_score for brevity
                //dev_corral.appendChild(check_pop);

                //  If the up_token (above the current token)
                //  is not the player's, break out of searching up.
                if(typeof up_token === 'undefined' || up_token.player != play.player) {
                  break;
                }
                else {
                  //check_pop.innerText = "|";
                  //check_pop.classList.add(action_class);
                  connected.push(up_token); //  else, add it to the connected array, and go to the next token.
                }
              }
              //  This ends the game at the first Connect4 //
              if(connected.length == 4) Connect4('vertical', connected);

              // Search right...
              connected = [];   //  Reset the array
              for(cnum = col_num + 3; cnum >= col_num && cnum <= 6;cnum--){
                let c = columns.labels[cnum];
                let right_token = game.columns[c][tok_num];
                //  If the right_token (same index, in columns to the right)
                //  is not the player's, break out of searching right.
                if(typeof right_token === 'undefined' || right_token.player != play.player) break;
                else connected.push(right_token); //  else, add it to the connected array, and go to the next token.
              }
              //  This ends the game at the first Connect4 //
              if(connected.length == 4) Connect4('horizontal', connected);

              // search diagonally (up/right)...
              connected = [];   // Reset the array
              for(cnum = col_num + 3, t=tok_num+3; cnum >= col_num && cnum <= 6 && t >= tok_num;cnum--, t--){
                let c = columns.labels[cnum];
                let upright_token = game.columns[c][t];
                //  If the up/right_token (above the current token,
                //  in the columns diagonally to the right) is not
                //  the player's, break out of searching up/right.
                if(typeof upright_token === 'undefined' || upright_token.player != play.player) break;
                else connected.push(upright_token); //  else, add it to the connected array, and go to the next token.
              }
              //  This ends the game at the first Connect4 //
              if(connected.length == 4) Connect4('up_right', connected);

              // search diagonally (down/right)...
              connected = [];   //  Reset the array
              for(cnum = col_num + 3, t=tok_num-3; cnum >= col_num && cnum <= 6 && t <= tok_num && t >= 0;cnum--, t++){
                let c = columns.labels[cnum];
                let downright_token = game.columns[c][t];
                //  If the down/right_token (below the current token,
                //  in the columns diagonally to the right) is not
                //  the player's, break out of searching down/right.
                if(typeof downright_token === 'undefined' || downright_token.player != play.player) break;
                else connected.push(downright_token); //  else, add it to the connected array, and go to the next token.
              }
              //  This ends the game at the first Connect4 //
              if(connected.length == 4) setTimeout(Connect4('down_right', connected), 3000);

            }
          }
        }
      }
    }
  }

  //  Firing this event kicks off all the logic from here,
  //  ending at either the next player's turn being displayed,
  //  or the applicable feedback being shown to the player causing
  //  the exception.
  async function play_token(e){
    //  Repackage the values from the player's choice,
    //  into a compact play object
    let player = e.target.attributes['data_player'].value;
    let column = e.target.attributes['data_column'].value;
    let play = {player: player, column: column};

    //  Ask the Game Engine whether this turn is valid.
    if(game.is_play_valid(play)){

      disable_controls();

      //  Calculate the position to land at, and then do so.
      play.position = game.row_count - game.columns[play.column].length;
      await drop_token(play);

      //  Add this turn to the Game Engine's stacks //
      game.turns.push(play);
      game.columns[play.column].push(play);

      //  Score this turn
      await game.score_turn(play);

      //  Continue on to change players on the UI //
      change_players();
    }
  }

  /* This handles the population of the appropriate token,
      dropping it to the correct position.
      *Note: Play must be validated before use. */
  async function drop_token(play){

    // Clone a template token, of the correct player's color... scrub off the "id" attribute.
    let active_token = (play.player == player.red) ? model_red.cloneNode(false) : model_yellow.cloneNode(false);
    active_token.removeAttribute('id');

    // Define and apply the class needed to drop the token to the correct position.
    let action_class = `${play.column}to${play.position}`;
    active_token.classList.add(play.column, action_class);

    // Pop the token in the corral, which is called "played_tokens".
    played_tokens.appendChild(active_token);
  }

  // While a turn is in process (after the click), and until a moment after
  // the controls should be inaccesible in case of rapid clicking.
  function disable_controls(){
    choice_a.classList.add("disabled");
    choice_b.classList.add("disabled");
    choice_c.classList.add("disabled");
    choice_d.classList.add("disabled");
    choice_e.classList.add("disabled");
    choice_f.classList.add("disabled");
  }

  // While a turn is in process (after the click), and until a moment after
  // the controls should be inaccesible in case of rapid clicking.
  // *Note: This one should be called after a delay for a less pushy interface.
  function enable_controls(){
    choice_a.classList.remove("disabled");
    choice_b.classList.remove("disabled");
    choice_c.classList.remove("disabled");
    choice_d.classList.remove("disabled");
    choice_e.classList.remove("disabled");
    choice_f.classList.remove("disabled");
  }

  //  Change sides by manipulating the attributes of the DOM elements. //
  function change_players(){
    game.tally_sheet = [];
    let next_player = (game.whos_turn == player.red) ? player.yellow : player.red;
    choice_a.attributes["data_player"].value = next_player;
    choice_a.classList.remove(game.whos_turn);
    choice_a.classList.add(next_player);
    choice_b.attributes["data_player"].value = next_player;
    choice_b.classList.remove(game.whos_turn);
    choice_b.classList.add(next_player);
    choice_c.attributes["data_player"].value = next_player;
    choice_c.classList.remove(game.whos_turn);
    choice_c.classList.add(next_player);
    choice_d.attributes["data_player"].value = next_player;
    choice_d.classList.remove(game.whos_turn);
    choice_d.classList.add(next_player);
    choice_e.attributes["data_player"].value = next_player;
    choice_e.classList.remove(game.whos_turn);
    choice_e.classList.add(next_player);
    choice_f.attributes["data_player"].value = next_player;
    choice_f.classList.remove(game.whos_turn);
    choice_f.classList.add(next_player);
    game.whos_turn = next_player;
    if(!game.game_finished) setTimeout(enable_controls,1000);
  }

  // This begins the transition into the scoreboard display.
  // Begin with showing the winner... fade out the board,
  // then display the scoreboard for this server.
  function declare_winner(){

    winner_circle.classList.add('fade_in');
    winner_label.classList.add(game.winner);
    winner_label.innerText = `${game.winner} player`;
    let winning_token = (game.winner == player.red) ? model_red.cloneNode(false) : model_yellow.cloneNode(false);
    winning_token.removeAttribute('id');
    winning_token.classList.add('winner_token');
    winner_circle.appendChild(winning_token);
    if (game.winner == player.red) {
      red_score.classList.add('winner_score');
      winner_circle.appendChild(red_score)
    }
    else {
      yellow_score.classList.add('winner_score');
      winner_circle.appendChild(yellow_score);
    }
  }

  //  Run through the tally sheet with an amenable pace, floating a score
  //  graphic out of each token for which a score was earned.
  async function scoring_phase(tally_sheet){
    while (scoring_display.firstChild) {
      scoring_display.removeChild(scoring_display.firstChild);
    }
    await tally_sheet.forEach(async (score) => {
      let score_pop = model_score[0].cloneNode(true);

      // Define and apply the class needed to position and pop the score earned.
      let action_class = `${score.token.column}${score.token.position}`;
      score_pop.classList.add(action_class);

      // Place the score into the corral, which is called "scoring_display".
      scoring_display.appendChild(score_pop);

      // Increment the score for the current player.
      if(score.token.player == player.red) {
        game.scores.red += score.points;
        red_score.innerText = game.scores.red;
      }
      if(score.token.player == player.yellow) {
        game.scores.yellow += score.points;
        yellow_score.innerText = game.scores.yellow;
      }
    });
  }

  // This is called at once when a Connect4 is detected, which ends the game.
  function Connect4(type, connection){
    game.game_finished = true;
    // Show the tokens flash to display the winning Connect4
    connection.forEach((token) => {
      let action_class = `${token.column}to${token.position}`;
      let Connect4_token = document.getElementsByClassName(action_class);
      let position_class = `${token.column}${token.position}`;
      Connect4_token[0].classList.add("Connect4", position_class);
      Connect4_token[0].classList.remove(action_class);
      game.winner = token.player;
    });

    // Transition from the Game Board to the Winner's Circle
    setTimeout(()=>{gameboard.classList.add('fade_away');},2000);
    setTimeout(declare_winner, 3000);
  }

  //  This will handle the anticipated exceptions being thrown by the players
  //  as well as in-process exceptions handled by Try/Catch statements, which
  //  if necessary, will trigger a redrawing of the board as last validated.
  function handle_it(exception){
    alert(exception);
  }

}, false);
