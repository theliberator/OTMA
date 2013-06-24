/**
 * This class implements a pathfinder in the form of the A* algorithm. It
 * should be called with the undelying map as well as start and end point in
 * the form of two arrays [x, y]. It returns an array with the moves in the
 * same format [x, y]. If no path is found, the array is empty. Special thanks
 * goes to Andrea Giammarchi. The algorithm is mostly taken from an
 * implementation by Andrea Giammarchi
 * (http://devpro.it/javascript_id_137.html) and modified to fit this project.
 *
 * @author	Andrea Giammarchi, Michael Seider
 * @license Mit Style License
 * @since	20.5.2012
 */

/* Find the moves that are valid for a given position (x, y) on the map and
 * return them in a dict object ({x: ,y: }). */
function successors(x, y, end, map){
	var
		N = y - 1,
		S = y + 1,
		E = x + 1,
		W = x - 1,
		$N = N > -1 && !map.isColliding(x, N, end),
		$S = S < map.rows && !map.isColliding(x, S, end),
		$E = E < map.cols && !map.isColliding(E, y, end),
		$W = W > -1 && !map.isColliding(W, y, end),
		result = [],
		i = 0
	;
	$N && (result[i++] = {x:x, y:N});
	$E && (result[i++] = {x:E, y:y});
	$S && (result[i++] = {x:x, y:S});
	$W && (result[i++] = {x:W, y:y});
	return result;
}

/* Returns the manhattan distance between start and end. */
function manhattan(start, end) {
	return Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
}

/* Returns the shortest path between start and end for underlying map. The
 * result is returned as an array with moves (e.g. ["right", "up", ...]). */
function AStar(map, start, end, f) {
	var
		limit = map.cols * map.rows,
		list = {},
		result = [],
		open = [{x:start[0], y:start[1], f:0, g:0, v:start[0]+start[1]*map.cols}],
		length = 1,
		adj = null,
		i, j, max, min, current, next
	;
	end = {x:end[0], y:end[1], v:end[0]+end[1]*map.cols};
	do {
		max = limit;
		min = 0;
		for(i = 0; i < length; ++i) {
			if((f = open[i].f) < max) {
				max = f;
				min = i;
			}
		};
		current = open.splice(min, 1)[0];
		if (current.v != end.v) {
			--length;
			next = successors(current.x, current.y, end, map, map.rows, map.cols);
			for(i = 0, j = next.length; i < j; ++i){
				(adj = next[i]).p = current;
				adj.f = adj.g = 0;
				adj.v = adj.x + adj.y * map.cols;
				if(!(adj.v in list)){
					adj.f = (adj.g = current.g + manhattan(adj, current)) + manhattan(adj, end);
					open[length++] = adj;
					list[adj.v] = 1;
				}
			}
		} else {
			/* Path found: Pack coordinates in result and reverse. */
			i = length = 0;
			do {
				result[i++] = [current.x, current.y];
			} while (current = current.p);
			result.reverse();
		}
	} while (length);

	/* Translate the coordinates into moves suitable for EventManager. */
	var move_list = [];

	for (i = 0; i < result.length - 1; i++){
		if (result[i][0] < result[i+1][0])
			move_list[i] = "right";
		else if (result[i][0] > result[i+1][0])
			move_list[i] = "left";
		else if (result[i][1] < result[i+1][1])
			move_list[i] = "down";
		else if (result[i][1] > result[i+1][1])
			move_list[i] = "up";
	}

	return move_list;

}
