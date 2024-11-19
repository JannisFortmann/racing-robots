#[test]
fn tile_size() {
	assert_eq!(std::mem::size_of::<crate::Cell>(), 1);
}

#[test]
fn test_cell_wall_count() {
	assert_eq!(crate::Cell::N.wall_count(), 1);
	assert_eq!(crate::Cell::W.wall_count(), 1);
	assert_eq!(crate::Cell::NW.wall_count(), 2);

	let mut c = crate::Cell::NO_WALLS;
	assert_eq!(c.wall_count(), 0);
	c.set_wall(crate::Direction::N);
	assert_eq!(c.wall_count(), 1);
	c.set_wall(crate::Direction::E);
	assert_eq!(c.wall_count(), 2);
	c.set_wall(crate::Direction::N);
	assert_eq!(c.wall_count(), 2);
	c.set_wall(crate::Direction::S);
	assert_eq!(c.wall_count(), 3);
	c.set_wall(crate::Direction::W);
	assert_eq!(c.wall_count(), 4);
	c.set_wall_to(crate::Direction::N, false);
	assert_eq!(c.wall_count(), 3);
}
