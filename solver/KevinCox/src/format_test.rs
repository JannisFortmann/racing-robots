const EMPTY: &str = "board 16 16
B N N N N N N N N N N N N N N N
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C B N W C C C C C C
W C C C C C C W C W C C C C C C
W C C C C C C N N C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
W C C C C C C C C C C C C C C C
mirrors 0
";

#[test]
fn parse_empty() {
	let board = crate::parse_board(&mut std::io::Cursor::new(EMPTY)).unwrap();
	let mut buf = Vec::new();
	board.serialize(&mut buf).unwrap();
	assert_eq!(String::from_utf8_lossy(&buf), EMPTY);
}
