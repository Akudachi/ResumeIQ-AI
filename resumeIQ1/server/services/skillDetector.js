class SkillDetector {
  static skillCategories = {
    programming: [
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
      'typescript', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart', 'haskell', 'elixir', 'clojure',
      'c', 'assembly', 'fortran', 'cobol'
    ],
    frontend: [
      'react', 'angular', 'vue', 'next.js', 'nuxt.js', 'svelte', 'ember', 'backbone', 'jquery',
      'bootstrap', 'tailwind', 'html', 'css', 'sass', 'less', 'webpack', 'vite', 'redux', 'mobx'
    ],
    backend: [
      'node.js', 'express', 'django', 'flask', 'spring', 'spring boot', 'rails', 'laravel', 'nest.js',
      'fastapi', 'graphql', 'rest api', 'soap', 'asp.net', 'phoenix', 'koa'
    ],
    databases: [
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra',
      'elasticsearch', 'neo4j', 'dynamodb', 'firebase', 'supabase', 'prisma', 'sequelize', 'mariadb'
    ],
    cloud: [
      'aws', 'azure', 'google cloud', 'gcp', 'heroku', 'digitalocean', 'linode', 'cloudflare',
      'openstack', 'serverless', 'lambda'
    ],
    ai: [
      'artificial intelligence', 'nlp', 'natural language processing', 'computer vision',
      'neural networks', 'llm', 'generative ai', 'chatgpt', 'langchain', 'llama', 'openai'
    ],
    machineLearning: [
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'pandas', 'numpy',
      'scikit-learn', 'opencv', 'nltk', 'spacy', 'data science', 'data analysis', 'mlops'
    ],
    devops: [
      'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'gitlab ci', 'circleci',
      'ci/cd', 'continuous integration', 'continuous deployment'
    ],
    tools: [
      'visual studio', 'vscode', 'intellij', 'eclipse', 'xcode', 'postman', 'figma', 'jira',
      'confluence', 'slack', 'trello', 'asana', 'notion'
    ],
    versionControl: [
      'git', 'github', 'gitlab', 'bitbucket', 'svn'
    ],
    operatingSystems: [
      'windows', 'linux', 'macos', 'unix', 'android', 'ios', 'ubuntu', 'debian', 'centos', 'redhat'
    ],
    frameworks: [
      'react native', 'flutter', 'ionic', 'cordova', 'electron', 'django', 'flask', 'spring',
      'rails', 'laravel', 'next.js', 'angular', 'vue'
    ],
    libraries: [
      'react', 'redux', 'numpy', 'pandas', 'scipy', 'matplotlib', 'seaborn', 'lodash', 'jquery'
    ]
  };

  static detect(text) {
    const lowerText = text.toLowerCase();
    const detectedSkills = {};

    for (const [category, skills] of Object.entries(this.skillCategories)) {
      detectedSkills[category] = skills.filter(skill => 
        lowerText.includes(skill.toLowerCase())
      );
    }

    return detectedSkills;
  }

  static getAllSkills(text) {
    const detected = this.detect(text);
    const allSkills = [];
    for (const categorySkills of Object.values(detected)) {
      allSkills.push(...categorySkills);
    }
    return [...new Set(allSkills)];
  }

  static getSkillCount(text) {
    const detected = this.detect(text);
    let count = 0;
    for (const categorySkills of Object.values(detected)) {
      count += categorySkills.length;
    }
    return count;
  }
}

module.exports = SkillDetector;
