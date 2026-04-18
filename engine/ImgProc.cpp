#include <iostream>
#include <fstream>
#include <vector>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <cmath>

//------------------------ Global variables---------------------------------//
std::vector<int> low;
std::vector<int> numberdetectedINT;
std::vector<std::string> numberdetectedSTR;
std::vector<std::vector<int>> CollectData; // 2D vector to collect the data.
std::ofstream out("output.txt");
std::vector<unsigned char> data;

struct Template {
    std::string name;
    std::vector<std::vector<int>> data;
};
std::vector<Template> templateNum;

int FrontVal, BackVal;
int w, h, maxv, valscr;
int loopp;
int cc = 0;
int ccc = 0;
bool onetimecheck = true;
double finalnum = 0;
// ----------------------------------------------------------------------- //

//--------------------Function declarations--------------------------------//
void Hist();
void printofile(int w);
void processdata(std::vector<int> sumzero, int firstY, int lastY);
std::vector<std::vector<int>> Resize(std::vector<std::vector<int>> img, int newWidth, int newHeight);
std::vector<int> nameToDigit(std::vector<std::string> num);
void TemplateNumber();
void Matching(std::vector<std::vector<int>> img);
// ----------------------------------------------------------------------- //

extern "C" {
    void myrun(unsigned char* input, int width, int height) {

        low.clear();
        numberdetectedINT.clear();
        numberdetectedSTR.clear();
        data.clear();
        finalnum = 0;
        onetimecheck = true;

        cc = 0;
        ccc = 0;
        FrontVal = 0;
        BackVal = 0;
        loopp = 0;

        w = width;
        h = height;
        maxv = 255;

        data.clear();
        data.resize(w * h);

        // std::cout << "DEBUG myrun start" << "\n";

        for (int i = 0; i < w * h; i++) {
            data[i] = input[i];
        }

        templateNum.clear();
        TemplateNumber();

        std::vector<int> sumzero;

        //------------------Collecting low rows--------------------------------
        valscr = w * 0.5;
        for (int y = 0; y < h; y++)
        {
            int count = 0;
            for (int x = 0; x < w; x++)
            {
                if (data[y * w + x] == 0)
                {
                    count++;
                }
            }
            if (count > 10 && count < valscr)
            {
                low.push_back(y);
            }
        }

        for (int y = 0; y < low.size(); y++)
        {
            for (int x = 0; x < w; x++)
            {
                if (y == 0)
                {
                    int v = data[low[y] * w + x];
                    if (v == 255)
                    {
                        sumzero.push_back(0);
                    }
                    else
                    {
                        sumzero.push_back(1);
                    }
                }
                else
                {
                    int v = data[low[y] * w + x];
                    if (v == 255)
                    {
                        sumzero[x] += 0;
                    }
                    else
                    {
                        sumzero[x] += 1;
                    }
                }
            }
        }

        //------------------Borderless image screening.------------------------
        int samplesize = 30;
        float xbarF, xbarB;
        float currentval, cvF, cvB;
        float stddevF = 0, stddevB = 0;

        xbarF = 0;
        for (int i = 0; i < samplesize; i++)
        {
            xbarF += sumzero[i];
        }
        xbarF = xbarF / samplesize;
        if (xbarF != 0)
        {
            for (int i = 0; i < samplesize; i++)
            {
                currentval = (sumzero[i] - xbarF) * (sumzero[i] - xbarF);
                stddevF = stddevF + currentval;
            }
            stddevF = stddevF / (samplesize - 1);
            stddevF = std::sqrt(stddevF);
            cvF = (stddevF / xbarF) * 100;
        }
        else
        {
            cvF = 0;
        }

        xbarB = 0;
        for (int i = sumzero.size() - 1; i > (sumzero.size() - samplesize - 1); i--)
        {
            xbarB += sumzero[i];
        }
        xbarB = xbarB / samplesize;
        if (xbarB != 0)
        {
            for (int i = sumzero.size() - 1; i > (sumzero.size() - samplesize - 1); i--)
            {
                currentval = (sumzero[i] - xbarB) * (sumzero[i] - xbarB);
                stddevB = stddevB + currentval;
            }
            stddevB = stddevB / (samplesize - 1);
            stddevB = std::sqrt(stddevB);
            cvB = (stddevB / xbarB) * 100;
        }
        else
        {
            cvB = 0;
        }

        FrontVal = 0;
        BackVal = 0;
        float sumval = 0;
        float previousval = 0;
        xbarF = 0;
        xbarB = 0;
        float calval;
        if (cvF <= 10 && cvB <= 10)
        {
            if (cvF == 0 && cvB == 0)
            {
                for (int i = 0; i < sumzero.size() - 1; i++)
                {
                    if (sumzero[i] != 0)
                    {
                        FrontVal = i;
                        break;
                    }
                }
                for (int i = sumzero.size() - 1; i > 0; i--)
                {
                    if (sumzero[i] != 0)
                    {
                        BackVal = i;
                        break;
                    }
                }
            }
            else
            {
                for (int i = 0; i < sumzero.size() - 1; i++)
                {
                    if (i < samplesize)
                    {
                        sumval += sumzero[i];
                        xbarF = sumval / (i + 1);
                        previousval = xbarF;
                    }
                    else
                    {
                        sumval += sumzero[i];
                        xbarF = sumval / (i + 1);
                        if (xbarF < previousval)
                        {
                            calval = 100 - ((xbarF / previousval) * 100);
                            if (calval > 0.9)
                            {
                                FrontVal = i + 1;
                                break;
                            }
                            else
                            {
                                previousval = xbarF;
                            }
                        }
                        else
                        {
                            previousval = xbarF;
                        }
                    }
                }
                sumval = 0;
                int counter = 1;
                for (int i = sumzero.size() - 1; i > 0; i--)
                {
                    if (i > sumzero.size() - samplesize - 1)
                    {
                        sumval += sumzero[i];
                        xbarB = sumval / counter;
                        previousval = xbarB;
                    }
                    else
                    {
                        sumval += sumzero[i];
                        xbarB = sumval / counter;
                        if (xbarB < previousval)
                        {
                            calval = 100 - ((xbarB / previousval) * 100);
                            if (calval > 0.9)
                            {
                                BackVal = i + 1;
                                break;
                            }
                            else
                            {
                                previousval = xbarB;
                            }
                        }
                        else
                        {
                            previousval = xbarB;
                        }
                    }
                    counter++;
                }
            }
        }

        if (FrontVal != 0 && BackVal != 0)
        {
            std::vector<int>().swap(low);
            for (int y = 0; y < h; y++)
            {
                int count = 0;
                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (data[y * w + x] == 0)
                    {
                        count++;
                    }
                }
                if (count > 50 && count < valscr)
                {
                    low.push_back(y);
                }
            }
        }

        std::vector<int>().swap(sumzero);

        if (low.empty()) return;

        int seq = low[0] - 1;
        int count = 0, firstY = 0;
        bool cont = true;
        if (FrontVal == 0 && BackVal == 0)
        {
            FrontVal = 0;
            BackVal = w - 1;
        }

        for (int y = 0; y < low.size(); y++)
        {
            count = 0;
            if (low[y] - seq == 1)
            {
                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (cont == true)
                    {
                        firstY = y;
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero.push_back(0);
                        }
                        else
                        {
                            sumzero.push_back(1);
                        }
                        count++;
                    }
                    else
                    {
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero[count] += 0;
                        }
                        else
                        {
                            sumzero[count] += 1;
                        }
                        count++;
                    }
                }
                cont = false;
            }
            else
            {
                if (low[y - 1] - low[firstY] >= 14)
                {
                    processdata(sumzero, low[firstY], low[y - 1]);
                }

                sumzero.clear();
                cont = true;

                for (int x = FrontVal; x <= BackVal; x++)
                {
                    if (cont == true)
                    {
                        firstY = y;
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero.push_back(0);
                        }
                        else
                        {
                            sumzero.push_back(1);
                        }
                        count++;
                    }
                    else
                    {
                        int v = data[low[y] * w + x];
                        if (v == 255)
                        {
                            sumzero[count] += 0;
                        }
                        else
                        {
                            sumzero[count] += 1;
                        }
                        count++;
                    }
                }
                cont = false;
            }
            seq = low[y];
        }

        numberdetectedINT = nameToDigit(numberdetectedSTR);
        int power = -2;
        double prevnum = 0;
        for (int i = 0; i < numberdetectedINT.size(); i++){
            prevnum = numberdetectedINT[i] * pow(10,power + i);
            finalnum = finalnum + prevnum;
            prevnum = 0;
        }

        auto now = std::chrono::system_clock::now();
        std::time_t t = std::chrono::system_clock::to_time_t(now);
        // std::cout << "Program completed: " << std::put_time(std::localtime(&t), "%H:%M:%S") << "\n";

        // std::cout << "DEBUG finalnum in myrun = " << finalnum << "\n";

        return;
    }
    
    double get_final() {
        // std::cout << "DEBUG get_final returning " << finalnum << "\n";
        return finalnum;
    }
}

void Hist()
{
    std::ifstream in("output.txt");
    int hist[256] = {0};

    int v;
    while (in >> v)
    {
        if (v >= 0 && v <= 255)
            hist[v]++;
    }

    std::ofstream out("hist.txt");
    for (int i = 0; i < 256; i++)
    {
        out << i << " " << hist[i] << "\n";
    }

    std::cout << "done: hist.txt\n";
}

void printofile(int w)
{
    if (FrontVal == 0 && BackVal == 0)
    {
        for (int y = 0; y < low.size(); y++)
        {
            for (int x = 0; x < w; x++)
            {
                int v = data[low[y] * w + x];
                if (v == 255)
                {
                    out << 1 << " ";
                }
                else
                {
                    out << v << " ";
                }
            }
            out << "\n";
        }
    }
    else
    {
        for (int y = 0; y < low.size(); y++)
        {
            for (int x = FrontVal; x <= BackVal; x++)
            {
                int v = data[low[y] * w + x];
                if (v == 255)
                {
                    out << 1 << " ";
                }
                else
                {
                    out << v << " ";
                }
            }
            out << "\n";
        }
    }
}

void processdata(std::vector<int> sumzero, int firstY, int lastY)
{
    // std::cout << "DEBUG processdata start firstY=" << firstY
            //   << " lastY=" << lastY
            //   << " sumzero.size=" << sumzero.size()
            //   << std::endl;

    int count = 0;
    int count1 = 0;
    int countSpace = 0;
    int MaxX = 0;
    int FrontX = 0;
    int BackX = 0;
    int countloop = 0;
    bool FirstVal= true;
    bool ContCheck = false; 
    bool FirstCheck = false;
    std::vector<int> spacing;
    std::vector<std::vector<int>> tempo;
    std::vector<std::vector<int>> TempoArrign;
    std::vector<int> New;
    std::vector<int> newsum0;

    for (int i = FrontVal; i <= BackVal; i++){
        if (sumzero[countloop] > 1){
            count++;
            if (count < 3){
                if (FirstVal == true){
                    FrontX = i;
                    FirstVal = false;
                }
                if (sumzero[countloop+1] <= 1){ 
                    count = 0;
                    FirstVal = true;
                }
                else if (sumzero[countloop+2] <= 1){
                    count = 0;
                    FirstVal = true;
                }
            }
            else if(count == 3){
                if (sumzero[countloop+1] <= 1){ 
                    count = 0;
                    FirstVal = true;
                }
            }
        }

        if (count > 3){
            if (MaxX < count){
                MaxX = count;
            }
            if (sumzero[countloop] <= 1){
                ContCheck = true;
                count = 0;
                BackX = i - 1;
            }
        }
        if (ContCheck == true){
            if (sumzero[countloop] <= 1){
                countSpace++;
            }
            if (sumzero[countloop+1] > 1){
                ContCheck = false;
                spacing.push_back(countSpace);
                FirstCheck = true;
                countSpace = 0; 
            }
            else if (countSpace > 20){
                ContCheck = false;
                FirstCheck = true;
                countSpace = 0;
                if (count1 == 0){
                    tempo.push_back({FrontX, BackX, firstY, lastY, count1, MaxX});
                    MaxX = 0;
                }
                else{
                    tempo.push_back({FrontX, BackX, firstY, lastY, count1+1, MaxX});
                    MaxX = 0;
                    count1 = 0;
                }
                FirstVal = true;
            }
        }
        if (spacing.size() > 1){
            if (spacing[1] < (spacing[0]+9)) {
                spacing.erase(spacing.begin()+1);
                count1++;
            }
            else{
                tempo.push_back({FrontX, BackX, firstY, lastY, count1+1, MaxX});
                MaxX = 0;
                count1 = 0;
                FirstVal = true;
                std::vector<int>().swap(spacing);
            }
        }
        countloop++;
    }

    // std::cout << "DEBUG tempo.size before filter = " << tempo.size() << std::endl;

    // ✅ แก้ fix 1: วน loop ถอยหลัง ป้องกัน erase ระหว่าง iterate
    for (int i = tempo.size() - 1; i >= 0; i--){
        if (BackVal == tempo[i][1]){
            tempo.erase(tempo.begin() + i);
        }
        else if (tempo[i][4] == 0){
            tempo.erase(tempo.begin() + i);
        }
    }

    // std::cout << "DEBUG tempo.size after filter = " << tempo.size() << std::endl;

    ContCheck = false;
    if (tempo.size() != 0){
        for (int i = 0; i < tempo.size(); i++){
            ContCheck = false;
            for (int y = tempo[i][2]; y <= tempo[i][3]; y++){
                int counting = 0;
                for (int x = tempo[i][0]; x <= tempo[i][1]; x++)
                {
                    if (data[y * w + x] == 0)
                    {
                        counting++;
                    }
                }
                if (ContCheck == true)
                {
                    if ((counting == 0) || (y == tempo[i][3]))
                    {
                        New.push_back(y);
                        ContCheck = false;
                    }
                }
                else{
                    if (counting != 0)
                    {
                        New.push_back(y);
                        ContCheck = true;
                    }
                }
                
                if (New.size() > 1)
                {
                    if (New[New.size() - 1] - (New[0]) >= 5)
                    {
                        for (int yy = New[0]; yy <= New[1]; yy++)
                        {
                            cc = 0;
                            for (int xx = tempo[i][0]; xx < tempo[i][1]; xx++)
                            {
                                if (yy == New[0])
                                {
                                    int v = data[yy * w + xx];
                                    if (v == 255)
                                    {
                                        newsum0.push_back(0);
                                    }
                                    else
                                    {
                                        newsum0.push_back(1);
                                    }
                                }
                                else
                                {
                                    int v = data[yy * w + xx];
                                    if (v == 255)
                                    {
                                        newsum0[cc] += 0;
                                    }
                                    else
                                    {
                                        newsum0[cc] += 1;
                                    }
                                    cc++;
                                }
                            }
                        }
                        cc = 0;
                        int fn = 0;
                        for (int lp = tempo[i][0]; lp <= tempo[i][1];lp++){
                            if (newsum0[cc] != 0){
                                fn = lp;
                                break;
                            }
                            cc++;
                        }
                        int ln = 0;
                        cc = newsum0.size() - 1;
                        for (int lp = tempo[i][1]; lp >= tempo[i][0];lp--){
                            if (newsum0[cc] != 0){
                                ln = lp;
                                break;
                            }
                            cc--;
                        }
                        TempoArrign.push_back({fn, ln, New[0], New[1]});
                    }

                    std::vector<int>().swap(New);
                    std::vector<int>().swap(newsum0);
                }
            }
        }

        // std::cout << "DEBUG TempoArrign.size = " << TempoArrign.size() << std::endl;

        std::vector<std::vector<int>>().swap(tempo);
        std::vector<int>().swap(newsum0);
        tempo = TempoArrign;

        // std::cout << "DEBUG final tempo.size before matching stage = " << tempo.size() << std::endl;

        // ✅ แก้ fix 2: toAdd ป้องกัน push_back ระหว่าง iterate
        std::vector<std::vector<int>> toAdd;

        for (int i = 0; i < tempo.size(); i++){
            int firstloop = 0;
            for (int y = tempo[i][2]; y <= tempo[i][3]; y++){
                cc = 0;
                for(int x = tempo[i][0]; x <= tempo[i][1]; x++){
                    if (firstloop == 0){
                        int v = data[y * w + x];
                        if (v==255){
                            New.push_back(0);
                        }
                        else{
                            New.push_back(1);
                        }
                    }
                    else{
                        int v = data[y * w + x];
                        if (v==255){
                            New[cc] += 0;
                        }
                        else{
                            New[cc] += 1;
                        }
                    }
                    cc++;
                }
                firstloop++;
            }
            ContCheck = false;
            int counting = 0;
            int prv = 100000000;
            int sp = 0;
            for (int x = tempo[i][0]; x <= tempo[i][1]; x++){
                if (New[sp] == 0){
                    counting++;
                }
                else{
                    if (counting > 0){
                        if (counting > prv + 5){
                            int bkX = tempo[i][1];
                            tempo[i][1] = x - counting - 1;
                            toAdd.push_back({x, bkX, tempo[i][2], tempo[i][3]});
                            // tempo.push_back({x, bkX, tempo[i][2], tempo[i][3]});  // ← push ตรงๆ ใน loop
                            break;
                        }
                        prv = counting;
                        counting = 0;
                    }
                }
                sp++;
            }

            // if (tempo[i][2] == 1285 && tempo[i][3] == 1335) {
            //     std::cout << "DEBUG TARGET tempo = "
            //             << tempo[i][0] << " "
            //             << tempo[i][1] << " "
            //             << tempo[i][2] << " "
            //             << tempo[i][3] << std::endl;

            //     std::cout << "DEBUG TARGET New values = ";
            //     for (int kk = 0; kk < New.size(); kk++) {
            //         std::cout << New[kk] << " ";
            //     }
            //     std::cout << std::endl;
            // }

            std::vector<int> result;
            cc = 0;
            int cc2 = 0;
            bool checking = true;
            double countcal = 0;
            double result1;
            double high = tempo[i][3]-tempo[i][2];
            for (int x = tempo[i][0]; x <= tempo[i][1]; x++){
                cc++;
                if (high < 80){
                    if (New[cc] <= 1){
                        if (checking == false){
                            result.push_back((100 / high) * countcal);
                            result1 = (100 / high) * countcal;
                            countcal = 0;
                            checking = true;
                        }
                    }
                    else{
                        if (New[cc] > countcal){
                            countcal = New[cc];
                        }
                        checking = false;
                    }
                }
            }

            // std::cout << "DEBUG result.size = " << result.size() << std::endl;
            // if (!result.empty()) {
            //     std::cout << "DEBUG result first = " << result[0]
            //             << " last = " << result[result.size() - 1]
            //             << std::endl;
            // }

            // std::cout << "DEBUG result.size = " << result.size() << std::endl;
            // if (!result.empty()) {
            //     std::cout << "DEBUG result values = ";
            //     for (int k = 0; k < result.size(); k++) {
            //         std::cout << result[k] << " ";
            //     }
            //     std::cout << std::endl;

            //     std::cout << "DEBUG result last = " << result[result.size() - 1] << std::endl;
            //     if (result.size() >= 3) {
            //         std::cout << "DEBUG result size-3 = " << result[result.size() - 3] << std::endl;
            //     }
            // }

            if (onetimecheck == true){
                if (result.size() > 3 && result.size() < 11){
                    if (result[result.size() - 1] > 45){
                        if (result[result.size() - 3] <= 22){

                            bool first = true;
                            for (int z = tempo[i][2] + 1; z < tempo[i][3]; z++){
                                cc2 = 0;
                                for(int t = tempo[i][1]; t >= tempo[i][0]; t--){
                                    if (first == true){
                                        int v = data[z * w + t];
                                        if (v==255){
                                            newsum0.push_back(0);
                                        }
                                        else{
                                            newsum0.push_back(1);
                                        }
                                    }
                                    else{
                                        int v = data[z * w + t];
                                        if (v==255){
                                            newsum0[cc2] += 0;
                                        }
                                        else{
                                            newsum0[cc2] += 1;
                                        }
                                        cc2++;
                                    }
                                }
                                first = false;
                            }
                            
                            std::vector<std::vector<int>> img(tempo[i][3]-(tempo[i][2] + 1));
                            int tempox = tempo[i][1];
                            first = true;
                            bool check0 = true;
                            bool check1 = true;
                            int avoiddot = 0;

                            for (int z = 0;z < newsum0.size(); z++){
                                if (newsum0[z] != 0){
                                    cc2 = 0;
                                    if (avoiddot != 2){
                                        for (int t = tempo[i][2] + 1; t < tempo[i][3]; t++){
                                            int v = data[t * w + tempox];
                                            if (first == true){
                                                if (v==255){
                                                    img[cc2].push_back(1);
                                                }
                                                else{
                                                    img[cc2].push_back(0);
                                                }
                                            }
                                            else{
                                                if (v==255){
                                                    img[cc2].insert(img[cc2].begin(), 1);
                                                }
                                                else{
                                                    img[cc2].insert(img[cc2].begin(), 0);
                                                }
                                            }
                                            cc2++;
                                        }
                                        first = false;
                                        check0 = true;
                                    }

                                    if (newsum0[z+1] == 0){
                                        check1 = true;
                                    }
                                }
                                if ((newsum0[z] == 0) || (z == newsum0.size() - 1)){
                                    if (avoiddot != 2){
                                        if (check0 == true){
                                            img = Resize(img,10,10);

                                            // std::cout << "DEBUG about to call Matching, img.size = " << img.size()
                                            //     << " x "
                                            //     << (img.empty() ? 0 : img[0].size())
                                            //     << std::endl;

                                            Matching(img);

                                            first = true;
                                            check0 = false;
                                            std::vector<std::vector<int>>().swap(img);
                                            img.resize(tempo[i][3] - (tempo[i][2] + 1));
                                        }
                                    }
                                    if (check1 == true){
                                        check1 = false;
                                        avoiddot++;
                                    }
                                }
                                tempox--;
                            }
                            onetimecheck = false;
                        }
                    }
                } 
            }
            std::vector<int>().swap(New);
            std::vector<int>().swap(result);
        }

        // ✅ แก้ fix 2: push toAdd หลัง loop จบ
        for (auto& v : toAdd) tempo.push_back(v);
    }
}

std::vector<std::vector<int>> Resize(std::vector<std::vector<int>> img, int newWidth, int newHeight){
    std::vector<std::vector<int>> resized(newHeight, std::vector<int>(newWidth));
    int oldHeight = img.size();
    int oldWidth = img[0].size();

    for (int i = 0; i < newHeight; i++){
        for (int j = 0; j < newWidth; j++){
            int oldX = j * oldWidth / newWidth;
            int oldY = i * oldHeight / newHeight;
            resized[i][j] = img[oldY][oldX];
        }
    }
    return resized;
}

void TemplateNumber(){

    std::vector<std::vector<int>> zero = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,1,0,0,1,1,0,0,0,1},
        {1,0,0,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,1}
    };

    std::vector<std::vector<int>> one = {
        {1,1,1,0,0,0,0,1,1,1},
        {1,1,0,0,0,0,0,1,1,1},
        {0,0,0,1,1,0,0,1,1,1},
        {1,0,1,1,1,0,0,1,1,1},
        {1,1,1,1,1,0,0,1,1,1},
        {1,1,1,1,1,0,0,1,1,1},
        {1,1,1,1,1,0,0,1,1,1},
        {1,1,1,1,1,0,0,1,1,1},
        {0,0,0,0,0,0,0,0,0,0},
        {0,0,0,0,0,0,0,0,0,0}
    };

    std::vector<std::vector<int>> one1 = {
        {1,1,1,1,1,0,0,0,0,0},
        {0,0,0,0,0,0,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0},
        {1,1,1,1,1,1,0,0,0,0}
    };

    std::vector<std::vector<int>> two = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,0,0,0,1,1},
        {1,1,1,1,0,0,0,1,1,1},
        {1,1,0,0,0,1,1,1,1,1},
        {1,0,0,0,0,0,0,0,0,0}
    };

    std::vector<std::vector<int>> three = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,1},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,0,0,0,1},
        {1,1,1,1,0,0,0,0,0,1},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {1,0,0,0,0,1,0,0,0,0}
    };

    std::vector<std::vector<int>> four = {
        {1,1,1,1,1,1,1,0,1,1},
        {1,1,1,1,1,1,0,0,0,1},
        {1,1,1,1,1,0,0,0,0,1},
        {1,1,1,1,0,0,1,0,0,1},
        {1,1,1,0,0,1,1,0,0,1},
        {1,1,0,0,1,1,1,0,0,1},
        {1,0,0,1,1,1,1,0,0,1},
        {0,0,0,0,0,0,0,0,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,1,1,0,0,1}
    };

    std::vector<std::vector<int>> five = {
        {1,0,0,0,0,0,0,0,0,1},
        {1,0,0,0,1,1,1,1,1,1},
        {1,0,0,1,1,1,1,1,1,1},
        {1,0,0,1,1,1,1,1,1,1},
        {1,0,0,0,0,0,0,0,1,1},
        {1,0,1,1,1,1,1,0,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,0,1,1,1,1,1,1,0,0},
        {0,0,0,0,1,0,0,0,0,1}
    };

    std::vector<std::vector<int>> six = {
        {1,1,1,1,0,0,0,0,0,1},
        {1,1,0,0,0,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,1,1},
        {0,0,0,1,1,1,1,1,1,1},
        {0,0,1,1,0,0,0,0,0,1},
        {0,0,0,0,1,1,1,0,0,0},
        {0,0,0,1,1,1,1,1,1,0},
        {0,0,1,1,1,1,1,1,1,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,0}
    };

    std::vector<std::vector<int>> seven = {
        {0,0,0,0,0,0,0,0,0,0},
        {1,0,1,1,0,1,0,0,0,0},
        {1,1,1,1,1,1,1,0,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,1,1,1,1,1,0,0,1,1},
        {1,1,1,1,1,0,0,0,1,1},
        {1,1,1,1,0,0,0,1,1,1},
        {1,1,1,1,0,0,1,1,1,1},
        {1,1,1,0,0,1,1,1,1,1},
        {1,1,0,0,0,1,1,1,1,1}
    };

    std::vector<std::vector<int>> eight = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,1,0,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,0,0,1,1,1,1,1,0,0},
        {1,1,0,0,0,1,0,0,0,1},
        {1,1,0,0,0,0,0,0,0,1},
        {1,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {1,0,0,0,1,1,0,0,0,0}
    };

    std::vector<std::vector<int>> nine = {
        {1,1,1,0,0,0,0,0,1,1},
        {1,0,0,0,1,1,0,0,0,1},
        {0,0,0,1,1,1,1,1,0,0},
        {0,0,1,1,1,1,1,1,0,0},
        {0,0,0,1,1,1,1,1,0,0},
        {1,0,0,0,1,1,0,0,0,0},
        {1,1,1,0,0,0,0,1,0,0},
        {1,1,1,1,1,1,1,1,0,0},
        {1,1,1,1,1,1,1,0,0,1},
        {1,0,0,0,0,0,0,0,0,1}
    };

    templateNum.push_back({"zero", zero});
    templateNum.push_back({"one", one});
    templateNum.push_back({"one1", one1});
    templateNum.push_back({"two", two});
    templateNum.push_back({"three", three});
    templateNum.push_back({"four", four});
    templateNum.push_back({"five", five});
    templateNum.push_back({"six", six});
    templateNum.push_back({"seven", seven});
    templateNum.push_back({"eight", eight});
    templateNum.push_back({"nine", nine});
}

void Matching(std::vector<std::vector<int>> img){

    int bestScore = -1;
    int bestIndex = -1;

    for (int i = 0; i < templateNum.size(); i++){

        int countmatch = 0;

        for (int y = 0; y < templateNum[i].data.size(); y++){
            for (int x = 0; x < templateNum[i].data[y].size(); x++){
                if (img[y][x] == templateNum[i].data[y][x]){
                    countmatch++;
                }
            }
        }

        if (countmatch > bestScore){
            bestScore = countmatch;
            bestIndex = i;
        }
    }

    double similarity = (double)bestScore / 100.0;

    // std::cout << "DEBUG similarity = " << similarity << "\n";

    if (similarity < 0.70){
        return;
    }

    std::string result = templateNum[bestIndex].name;
    numberdetectedSTR.push_back(result);
}

std::vector<int> nameToDigit(std::vector<std::string> num){
    
    std::vector<int> result;

    for (int i = 0; i < num.size(); i++){
        if (num[i].find("zero") == 0){
            result.push_back(0);
        }
        else if (num[i].find("one") == 0){
            result.push_back(1);
        }
        else if (num[i].find("two") == 0){
            result.push_back(2);
        }
        else if (num[i].find("three") == 0){
            result.push_back(3);
        }
        else if (num[i].find("four") == 0){
            result.push_back(4);
        }
        else if (num[i].find("five") == 0){
            result.push_back(5);
        }
        else if (num[i].find("six") == 0){
            result.push_back(6);
        }
        else if (num[i].find("seven") == 0){
            result.push_back(7);
        }
        else if (num[i].find("eight") == 0){
            result.push_back(8);
        }
        else if (num[i].find("nine") == 0){
            result.push_back(9);
        }
    }
    
    return result;
}