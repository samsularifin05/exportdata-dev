repoNameProduction="exportdata";
repoName="exportdata-dev";
cd ../"$repoNameProduction" &&
echo "Enter Name Branch : "
read branch_name;

git checkout $branch_name
rm -r ../$repoNameProduction/assets/*
rm -r ../$repoNameProduction/*
cp -r ../$repoName/build/.htaccess ../$repoNameProduction
cp -r ../$repoName/build/* ../$repoNameProduction

echo "Commit Message : "
read commit_message;

git branch | sed s/*// | sed 's/ *//g' > branch.txt


branch_exists="none"
while read branch; do
    if [ "$branch" = "$branch_name" ]; then
            branch_exists=$branch
    fi;
done < branch.txt

if [ "$branch_exists" = "none" ]; then
    git branch $branch_name
fi;
git checkout $branch_name

rm branch.txt

git add .
git commit -m "$commit_message"
git push -u origin $branch_name