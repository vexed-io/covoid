(cd api &&
heroku container:push web -a vexed-corona &&
heroku container:release web -a vexed-corona)