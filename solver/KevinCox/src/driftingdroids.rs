pub const ROBOT_FROM: [crate::Robot; 5] = [
	crate::Robot::RED,
	crate::Robot::GREEN,
	crate::Robot::BLUE,
	crate::Robot::YELLOW,
	crate::Robot::BLACK,
];

pub const ROBOT_TO: [u8; 5] = [
	4,
	0,
	1,
	3,
	2
];

pub const QUADRENT_FROM: [crate::Robot; 4] = [
	crate::Robot::GREEN,
	crate::Robot::BLUE,
	crate::Robot::RED,
	crate::Robot::YELLOW,
];

pub const QUADRENT_TO: [u8; 4] = [
	2, // RED
	0, // GREEN
	3, // YELLOW
	1, // BLUE
];

pub fn position_to(pos: crate::Position) -> u8 {
	pos.y() << 4 | pos.x()
}

pub fn parse_nibble(c: char) -> Result<u8, &'static str> {
	match c {
		'0'..='9' => Ok(((c as u32) - ('0' as u32)) as u8),
		'A'..='F' => Ok((10 + (c as u32) - ('A' as u32)) as u8),
		_ => Err("Invalid hex char"),
	}
}

pub fn parse_position(s: &str) -> Result<crate::Position, &'static str> {
	if s.len() != 2 {
		return Err("Position must be 2 chars")
	}
	let mut chars = s.chars();
	let n1 = parse_nibble(chars.next().unwrap())?;
	let n2 = parse_nibble(chars.next().unwrap())?;
	debug_assert_eq!(chars.next(), None);

	Ok(crate::Position::new(n2, n1))
}
