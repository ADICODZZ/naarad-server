const User = require('../models/user');


exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences  = req.body;

    console.log(req.body, "Incoming Preferences Payload");

    if (!preferences || !preferences.frequency) {
      return res.status(400).json({ message: 'category and frequencyTiming are required inside preferences' });
    }

    if(preferences.sports.selectedTags.length!=0){
      const selectedsport = preferences.sports.selectedTags[0];
      
      const subcategory=selectedsport.split("_")[0];
      console.log(subcategory,"subcategory");
      const tags=[];

      for(let i=0;i<preferences.sports.selectedTags.length;i++){
        tags[i]=preferences.sports.selectedTags[i].split("_")[1];
      }
      console.log(tags,"tags");

      const favPlayers=[];
      const followUpQuestions=preferences.sports.followUpAnswers

      for(let i=0;i<followUpQuestions.favPlayer?.selectedPredefinedTags?.length;i++){
        favPlayers[i]=followUpQuestions.favPlayer?.selectedPredefinedTags[i];
      }
      console.log(favPlayers,"favPlayers");

      const favTeams=[];
      for(let i=0;i<followUpQuestions.favTeam?.selectedPredefinedTags?.length;i++){
        favTeams[i]=followUpQuestions.favTeam?.selectedPredefinedTags[i];
      }
      console.log(favTeams,"favTeams");

      const updateType=[];
      for(let i=0;i<followUpQuestions.updateType?.selectedPredefinedTags?.length;i++){
        updateType[i]=followUpQuestions.updateType?.selectedPredefinedTags[i];
      }
      console.log(updateType,"updateType");

      const matchFormat=[];
      for(let i=0;i<followUpQuestions.matchFormat?.selectedPredefinedTags?.length;i++){
        matchFormat[i]=followUpQuestions.matchFormat?.selectedPredefinedTags[i];
      }
      console.log(matchFormat,"matchFormat");

      const eventScope=[];
      for(let i=0;i<followUpQuestions.eventScope?.selectedPredefinedTags?.length;i++){
        eventScope[i]=followUpQuestions?.eventScope?.selectedPredefinedTags[i];
      }
      console.log(eventScope,"eventScope");

      const instructionTags=[...preferences.sports.instructionTags]
      console.log(instructionTags,"instructionTags");

      const aiQuestions=[...preferences.sports.aiFollowUpQuestions];

      preferences.sports={
        subcategory,
        tags,
        favPlayers,
        favTeams,
        updateType,
        matchFormat,
        eventScope,
        instructionTags,
        aiGeneratedAnswers: aiQuestions
      }

      if(preferences.frequency=="Morning Digest"){
        preferredTime="09:00 AM";
      }else if(preferences.frequency=="Evening Summary"){
        preferredTime="06:00 PM";
      }else if(preferences.frequency=="Custom"){
        preferredTime=preferences.customFrequencyTime
      }else{
        prefferedTime="09:00 AM";
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.category.push("sports");
      user.alertPaused=preferences.alertPaused;

      user.preferences.sports ={
        subcategory,
        tags,
        favPlayers,
        favTeams,
        updateType,
        matchFormat,
        eventScope,
        instructionTags
      }
      user.frequencyTiming.frequency=preferences.frequency;
      user.frequencyTiming.preferredTime=preferredTime;
      user.customInterestTags=preferences.customInterestTags;
      //user.frequencyTiming.deliveryPlatform=preferences.deliveryPlatform;

      await user.save();
      //return res.status(200).json({ message: 'Preferences updated successfully', user });
    }


    if(preferences.news?.selectedTags?.length!=0){
      const { userId } = req.params;
     const preferences  = req.body;

    console.log(req.body, "Incoming Preferences Payload");

    if (!preferences || !preferences.frequency) {
      return res.status(400).json({ message: 'category and frequencyTiming are required inside preferences' });
    }

    

    if(preferences.news.selectedTags.length!=0){
      
      const tags=[];

      for(let i=0;i<preferences.news.selectedTags.length;i++){
        tags[i]=preferences.news.selectedTags[i].split("_")[1];
      }
      console.log(tags,"tags");

    

     const followUpQuestions=preferences.news.followUpAnswers;

     const newsFormatPreference=[]
     for(let i=0;i<followUpQuestions?.newsFormatPreference?.selectedPredefinedTags?.length;i++){
        newsFormatPreference[i]=followUpQuestions.newsFormatPreference.selectedPredefinedTags[i];
     }
     console.log(newsFormatPreference,"newsFormatPreference");

     const newsSources=[]
     for(let i=0;i<followUpQuestions.newsSources.selectedPredefinedTags?.length;i++){
        newsSources[i]=followUpQuestions.newsSources.selectedPredefinedTags[i];
     }
     console.log(newsSources,"newsSources");
     const topicDepth=[]
     for(let i=0;i<followUpQuestions.topicDepth.selectedPredefinedTags?.length;i++){
        topicDepth[i]=followUpQuestions.topicDepth.selectedPredefinedTags[i];
     }
     console.log(topicDepth,"topicDepth");

     const instructionTags=[...preferences.news.instructionTags]
     console.log(instructionTags,"instructionTags");

     if(preferences.frequency=="Morning Digest"){
        preferredTime="09:00 AM";
      }else if(preferences.frequency=="Evening Summary"){
        preferredTime="06:00 PM";
      }else if(preferences.frequency=="Custom"){
        preferredTime=preferences.customFrequencyTime
      }else{
        prefferedTime="09:00 AM";
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.category.push("news");
      user.alertPaused=preferences.alertPaused;

      user.preferences.news ={
        tags,
        newsFormatPreference,
        newsSources,
        topicDepth,
        instructionTags
        
      }
      user.frequencyTiming.frequency=preferences.frequency;
      user.frequencyTiming.preferredTime=preferredTime;
      user.customInterestTags=preferences.customInterestTags;
      //user.frequencyTiming.deliveryPlatform=preferences.deliveryPlatform;

      await user.save();
      //return res.status(200).json({ message: 'Preferences updated successfully', user });

    }

    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
   

    res.status(200).json({
      message: 'Preferences updated successfully',
      user,
    });

  } catch (error) {
    console.error('Error updating preferences:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
