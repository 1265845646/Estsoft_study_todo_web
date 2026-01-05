const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('server ok');
});

app.listen(3000, () => {
  console.log('서버 실행중: http://localhost:3000');
});
